"""Persistent scientific resources; metadata is never treated as verified full text."""
import hashlib, io, json, math, os, re, secrets, time
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal
import httpx
from fastapi import FastAPI, Depends, File, Form, Header, HTTPException, UploadFile, Request
from fastapi.responses import JSONResponse
from fastapi.responses import FileResponse
from starlette.middleware.gzip import GZipMiddleware
from pydantic import BaseModel, Field, HttpUrl
from pypdf import PdfReader
from sqlalchemy import JSON, Column, String, create_engine, select
from sqlalchemy.orm import DeclarativeBase, Session
from . import semantic

ROOT=Path(os.getenv('STORAGE_DIR',str(Path(__file__).resolve().parents[1]/'storage')))
ROOT.mkdir(parents=True,exist_ok=True)
engine=create_engine(os.getenv('DATABASE_URL',f'sqlite:///{ROOT / "repository.sqlite"}'))
class Base(DeclarativeBase): pass
class Resource(Base):
    __tablename__='resources'
    id=Column(String(64),primary_key=True)
    data=Column(JSON,nullable=False)
    chunks=Column(JSON,nullable=False)
    filename=Column(String(80),nullable=True)
class Draft(Base):
    __tablename__='drafts'
    id=Column(String(64),primary_key=True)
    data=Column(JSON,nullable=False)
class Enquiry(Base):
    __tablename__='enquiries'
    id=Column(String(64),primary_key=True)
    data=Column(JSON,nullable=False)
Base.metadata.create_all(engine)
app=FastAPI(title='Dakshinsetu Knowledge API',version='1.0.0')
app.add_middleware(GZipMiddleware, minimum_size=1024)
_requests={}
@app.middleware('http')
async def limits(request:Request,call_next):
    if request.method=='POST':
        length=request.headers.get('content-length','0')
        if not length.isdigit() or int(length)>31*1024*1024: return JSONResponse({'detail':'Request too large'},status_code=413)
        if request.url.path in ('/api/v1/ask','/api/v1/generate','/api/v1/enquiries'):
            key=(request.client.host if request.client else 'unknown',request.url.path)
            recent=[t for t in _requests.get(key,[]) if t>time.monotonic()-60]
            if len(recent)>=12: return JSONResponse({'detail':'Please wait a minute before sending more requests'},status_code=429)
            _requests[key]=recent+[time.monotonic()]
            if len(_requests)>10000: _requests.clear()
    response=await call_next(request)
    response.headers.setdefault('X-Content-Type-Options','nosniff')
    response.headers.setdefault('Referrer-Policy','strict-origin-when-cross-origin')
    response.headers.setdefault('Permissions-Policy','camera=(), microphone=(), geolocation=()')
    response.headers.setdefault('X-Frame-Options','DENY')
    return response

class EnquiryInput(BaseModel):
    name:str=Field(min_length=2,max_length=120)
    email:str=Field(pattern=r'^[^\s@]+@[^\s@]+\.[^\s@]+$',max_length=254)
    message:str=Field(min_length=10,max_length=4000)
@app.post('/api/v1/enquiries')
def enquiry(body:EnquiryInput):
    rid=secrets.token_hex(12)
    with Session(engine) as session: session.add(Enquiry(id=rid,data={**body.model_dump(),'created_at':now()}));session.commit()
    return {'id':rid,'status':'stored','message':'Saved for the portal operator. No email was sent to NCPOR.'}
@app.get('/api/v1/enquiries',dependencies=[])
def enquiries(request:Request,authorization:str|None=Header(default=None)):
    authorize(request,authorization)
    with Session(engine) as session: return [{'id':r.id,**r.data} for r in session.scalars(select(Enquiry))]

class Metadata(BaseModel):
    title:str=Field(min_length=3,max_length=300)
    resource_type:Literal['report','publication','dataset','photo','video','expedition','activity']
    region:Literal['Antarctic','Arctic','Himalaya','Southern Ocean','Multiple']
    source_url:HttpUrl
    source_owner:str=Field(min_length=2,max_length=200)
    description:str=Field(default='',max_length=10000)
    licence:str=Field(default='Unknown — redistribution not established',max_length=300)
    topics:list[str]=Field(default_factory=list,max_length=30)
    station:str|None=None
    publication_date:str|None=None
    related_ids:list[str]=Field(default_factory=list,max_length=30)
    rights_confirmed:bool=False
    availability:Literal['online','offline','restricted','metadata-only']='metadata-only'
class Query(BaseModel):
    query:str=Field(min_length=2,max_length=1200)
    region:str|None=None
class Outreach(BaseModel):
    source_ids:list[str]=Field(min_length=1,max_length=4)
    audience:Literal['students','educators','public','journalists']='students'
    format:Literal['explainer','press-release','social-thread']='explainer'
def now(): return datetime.now(timezone.utc).isoformat()
def authorize(request:Request,authorization:str|None=Header(default=None)):
    key=os.getenv('CURATOR_TOKEN','')
    if key and secrets.compare_digest(authorization or '',f'Bearer {key}'): return
    from .accounts import require_role
    require_role(request, ('admin',))

def contributor(request:Request,authorization:str|None=Header(default=None)):
    key=os.getenv('CURATOR_TOKEN','')
    if key and secrets.compare_digest(authorization or '',f'Bearer {key}'): return
    from .accounts import require_role
    require_role(request, ('researcher','admin'))
def public(r): return {'id':r.id,**r.data,'chunk_count':len(r.chunks),'file_url':f'/api/v1/resources/{r.id}/file' if r.filename else None}
def find(session,rid):
    r=session.get(Resource,rid)
    if r is None: raise HTTPException(404,'Resource not found')
    return r
def ingest(metadata,content=None,suffix=''):
    data=metadata.model_dump(mode='json')
    digest=hashlib.sha256(content if content is not None else json.dumps(data,sort_keys=True).encode()).hexdigest()
    rid=digest[:24]
    with Session(engine) as session:
        existing=session.get(Resource,rid)
        if existing: return {'duplicate':True,'resource':public(existing)}
        pages=[]; mime=None; chunks=[]
        if content is not None:
            if not metadata.rights_confirmed: raise HTTPException(422,'Redistribution rights must be confirmed')
            if len(content)>30*1024*1024: raise HTTPException(413,'Maximum size is 30 MB')
            if suffix=='.pdf':
                if not content.startswith(b'%PDF-'): raise HTTPException(422,'Invalid PDF signature')
                try:
                    reader=PdfReader(io.BytesIO(content))
                    if reader.is_encrypted or len(reader.pages)>500: raise ValueError()
                    pages=[(i+1,p.extract_text() or '') for i,p in enumerate(reader.pages)]
                except Exception: raise HTTPException(422,'PDF extraction failed; use an unlocked text PDF')
                mime='application/pdf'
            elif suffix in ('.txt','.md','.csv'):
                try: text=content.decode('utf-8-sig')
                except UnicodeError: raise HTTPException(422,'Use UTF-8 text')
                if '\x00' in text: raise HTTPException(422,'Binary data is not text')
                pages=[(None,text)];mime='text/plain; charset=utf-8'
            elif suffix in ('.jpg','.jpeg','.png','.webp'):
                valid=(suffix in ('.jpg','.jpeg') and content.startswith(b'\xff\xd8\xff')) or (suffix=='.png' and content.startswith(b'\x89PNG\r\n\x1a\n')) or (suffix=='.webp' and content[:4]==b'RIFF' and content[8:12]==b'WEBP')
                if not valid: raise HTTPException(422,'Invalid image signature')
                mime='image/jpeg' if suffix in ('.jpg','.jpeg') else 'image/'+suffix[1:]
            elif suffix=='.mp4' and content[4:8]==b'ftyp': mime='video/mp4'
            else: raise HTTPException(422,'Supported: PDF, TXT, MD, CSV, JPEG, PNG, WEBP, MP4')
        for page,text in pages:
            for offset in range(0,len(text),1100):
                segment=text[offset:offset+1400].strip()
                if segment: chunks.append({'document_id':rid,'chunk_id':f'{rid}-{len(chunks)+1:04}','page':page,'section':f'PDF page {page}' if page else 'Document text','text':segment,'offset':offset})
        if not chunks and metadata.description:
            chunks=[{'document_id':rid,'chunk_id':f'{rid}-metadata','page':None,'section':'Submitted metadata (not full text)','text':metadata.description,'offset':0}]
        filename=digest+suffix if content is not None else None
        data.update(sha256=digest,created_at=now(),verification='pending-review',extraction_status='text-extracted' if any(t.strip() for _,t in pages) else 'metadata-only',safety_status='format-checked; antivirus not performed',mime_type=mime,byte_size=len(content) if content else 0)
        if filename: (ROOT/filename).write_bytes(content)
        record=Resource(id=rid,data=data,chunks=chunks,filename=filename)
        session.add(record);session.commit()
        return {'duplicate':False,'resource':public(record)}

@app.get('/health')
@app.get('/api/v1/health')
def health(): return {'status':'ok','storage':'persistent','retrieval':semantic.mode(),'semantic_embeddings':semantic.enabled() and not semantic._failed,'gemini_configured':bool(os.getenv('GEMINI_API_KEY'))}
@app.get('/api/v1/resources')
def resources(region:str|None=None,resource_type:str|None=None):
    with Session(engine) as session:
        items=[public(r) for r in session.scalars(select(Resource)) if (not region or r.data['region']==region) and (not resource_type or r.data['resource_type']==resource_type)]
    return {'items':items,'count':len(items),'scope':'Stored catalogue, not all polar datasets worldwide'}
@app.get('/api/v1/datasets')
def datasets(): return resources(resource_type='dataset')
@app.get('/api/v1/resources/{rid}')
def resource(rid:str):
    with Session(engine) as session:
        r=find(session,rid);return {**public(r),'chunks':r.chunks}
@app.get('/api/v1/resources/{rid}/file')
def file(rid:str):
    with Session(engine) as session:
        r=find(session,rid)
        if not r.filename: raise HTTPException(404,'Metadata-only record: no local file')
        return FileResponse(ROOT/r.filename,media_type=r.data['mime_type'],headers={'X-Content-Type-Options':'nosniff','Content-Security-Policy':'sandbox'})
@app.post('/api/v1/resources',dependencies=[Depends(contributor)])
def register(metadata:Metadata): return ingest(metadata)
@app.post('/api/v1/ingest',dependencies=[Depends(contributor)])
async def upload(metadata:str=Form(...),file:UploadFile=File(...)):
    try: parsed=Metadata.model_validate_json(metadata)
    except ValueError: raise HTTPException(422,'Invalid metadata JSON')
    return ingest(parsed,await file.read(30*1024*1024+1),Path(file.filename or '').suffix.lower())
@app.post('/api/v1/resources/{rid}/review',dependencies=[Depends(authorize)])
def review(rid:str):
    with Session(engine) as session:
        r=find(session,rid);r.data={**r.data,'verification':'curator-reviewed','reviewed_at':now()};session.commit();return public(r)

STOP=set('the a an is are was were what when where how why does do of in at and or to for about tell me please give explain this that it its from with can you'.split())
def tokens(text): return [w for w in re.findall(r'[a-z0-9]+',text.lower()) if w not in STOP and len(w)>1]
def retrieve(query,region=None):
    with Session(engine) as session:
        rows=[(public(r),c) for r in session.scalars(select(Resource)) if not region or r.data['region']==region for c in r.chunks]
    terms=set(tokens(query));counters=[Counter(tokens(c['text'])) for _,c in rows]
    avg=sum(sum(c.values()) for c in counters)/max(1,len(counters));hits=[]
    frequencies={term:sum(term in c for c in counters) for term in terms}
    cosine=semantic.score(query,[c for _,c in rows]) if rows else None
    for i,((record,chunk),counts) in enumerate(zip(rows,counters)):
        score=0
        for term in terms:
            tf=counts[term];df=frequencies[term]
            if tf: score+=math.log(1+(len(rows)-df+.5)/(df+.5))*tf*2.2/(tf+1.2*(.25+.75*sum(counts.values())/max(1,avg)))
        similarity=cosine[i] if cosine is not None else None
        if score or (similarity is not None and similarity>=.45): hits.append({'resource':record,**chunk,'snippet':chunk['text'],'lexical_score':round(score,4),'semantic_score':similarity,'combined_score':.55*(score/(score+2))+.45*max(0,similarity or 0),'query_coverage':len(terms & counts.keys())/max(1,len(terms))})
    return sorted(hits,key=lambda h:h['combined_score'],reverse=True)[:8]
@app.post('/api/v1/search')
def search(request:Query): return {'query':request.query,'hits':retrieve(request.query,request.region),'retrieval_mode':semantic.mode()}
def insufficient(): return {'status':'insufficient_evidence','answer':'Insufficient evidence in the reviewed repository. Try a narrower question or add and review a relevant source.','evidence':[],'provider':'local','is_draft':False}
async def generate(prompt, has_evidence=None):
    key=os.getenv('GEMINI_API_KEY')
    if not key: return None
    model=os.getenv('GEMINI_MODEL','gemini-3.5-flash-lite')
    if has_evidence is None:
        has_evidence = 'Evidence:' in prompt
    if has_evidence:
        sys_instruction = (
            "You are Polaris AI, an expert assistant for India's Polar Science Portal (Dakshinsetu). "
            "Use the provided evidence to answer the question, citing chunk IDs [like this] where appropriate. "
            "Be clear, informative, and engaging."
        )
    else:
        sys_instruction = (
            "You are Polaris AI, an intelligent and helpful assistant for India's Polar Science Portal (Dakshinsetu). "
            "Answer the user's question clearly, politely, and comprehensively using your knowledge. "
            "Provide helpful, accurate, and detailed answers to any general or scientific questions."
        )
    try:
        async with httpx.AsyncClient(timeout=35) as client:
            response=await client.post(
                f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
                headers={'x-goog-api-key':key},
                json={
                    'systemInstruction':{'parts':[{'text':sys_instruction}]},
                    'contents':[{'parts':[{'text':prompt}]}],
                    'generationConfig':{'temperature':.4,'maxOutputTokens':1600}
                }
            )
        response.raise_for_status()
        return ''.join(p.get('text','') for p in response.json().get('candidates',[{}])[0].get('content',{}).get('parts',[])).strip() or None
    except Exception as e:
        print(f"[Gemini API Error]: {e}")
        return None
@app.post('/api/v1/ask')
async def ask(request:Query):
    evidence=[h for h in retrieve(request.query,request.region) if h['query_coverage']>=.5 and (h['semantic_score'] is None or h['semantic_score']>=.40) and h['resource']['verification']=='curator-reviewed'][:3]
    if evidence:
        context='\n\n'.join(f"[{e['chunk_id']}] {e['text']}" for e in evidence)
        prompt=f'Question: {request.query}\nEvidence:\n{context}'
        answer=await generate(prompt,has_evidence=True)
    else:
        context=''
        answer=None
    if answer and ('INSUFFICIENT_EVIDENCE' in answer or not any(e['chunk_id'] in answer for e in evidence)):
        return {'status':'insufficient_evidence','answer':'The generated answer could not be supported by cited repository evidence.','provider':'local','is_draft':False,'evidence':evidence}
    fallback_text = ('Relevant source excerpts:\n\n' + context) if evidence else "I'm sorry, I could not generate an answer at this time."
    return {
        'status':'draft' if answer else ('source_excerpts' if evidence else 'insufficient_evidence'),
        'answer':answer or fallback_text,
        'provider':'gemini' if answer else ('local-extractive' if evidence else 'local'),
        'is_draft':bool(answer),
        'evidence':evidence
    }
@app.post('/api/v1/generate')
async def outreach(request:Outreach):
    evidence=[]
    with Session(engine) as session:
        for rid in request.source_ids:
            r=find(session,rid)
            if r.data['verification']!='curator-reviewed': raise HTTPException(422,'Review sources before generating outreach')
            evidence.extend(r.chunks[:3])
    if not evidence: raise HTTPException(422,'No source text available')
    context='\n\n'.join(f"[{e['chunk_id']}] {e['text']}" for e in evidence)
    answer=await generate(f'Create a {request.format} for {request.audience}, at most 400 words. Keep citations.\nEvidence:\n{context}')
    if answer and ('INSUFFICIENT_EVIDENCE' in answer or not any(e['chunk_id'] in answer for e in evidence)): raise HTTPException(422,'No usable cited draft returned')
    result={'id':secrets.token_hex(12),'is_draft':True,'status':'review-required','provider':'gemini' if answer else 'extractive-template','audience':request.audience,'format':request.format,'content':answer or f'{request.format.upper()} — source selection for {request.audience}\n\n{context}\n\nConnect Gemini for audience-adapted rewriting. These are source excerpts, not a completed article.','evidence':evidence,'created_at':now()}
    with Session(engine) as session: session.add(Draft(id=result['id'],data=result));session.commit()
    return result
@app.get('/api/v1/drafts/{rid}')
def draft(rid:str):
    with Session(engine) as session:
        r=session.get(Draft,rid)
        if not r: raise HTTPException(404,'Draft not found')
        return r.data
