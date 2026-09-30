import hashlib
import json
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from app import repository as repo
from app import accounts

@pytest.fixture
def client(tmp_path,monkeypatch):
    database=create_engine('sqlite://',connect_args={'check_same_thread':False},poolclass=StaticPool)
    repo.Base.metadata.create_all(database)
    monkeypatch.setattr(repo,'engine',database)
    monkeypatch.setattr(repo,'ROOT',tmp_path)
    monkeypatch.setenv('CURATOR_TOKEN','test-curator')
    monkeypatch.delenv('GEMINI_API_KEY',raising=False)
    monkeypatch.setenv('SEMANTIC_SEARCH','0')
    repo._requests.clear()
    accounts._attempts.clear()
    with TestClient(repo.app) as c: yield c
    database.dispose()

META={'title':'Himadri test document','region':'Arctic','resource_type':'report','source_owner':'Test fixture','source_url':'https://example.org/source','rights_confirmed':True,'licence':'Test data'}
AUTH={'Authorization':'Bearer test-curator'}
TEXT=b'Himadri observations include aerosol sampling. These are test fixtures, not real research records.'
def upload(client,content=TEXT,filename='source.txt',metadata=None):
    return client.post('/api/v1/ingest',headers=AUTH,data={'metadata':json.dumps(metadata or META)},files={'file':(filename,content)})

def test_health(client): assert client.get('/health').json()['storage']=='persistent'

LOGIN={'email':'researcher@example.org','password':'test-password-long-enough'}
CSRF={'X-Requested-With':'Dakshinsetu'}

def sign_in(client,role='researcher'):
    accounts.create_account(LOGIN['email'],'Test Researcher',LOGIN['password'],role)
    return client.post('/api/v1/auth/login',headers=CSRF,json=LOGIN)

def test_registration_cannot_choose_admin(client):
    r=client.post('/api/v1/auth/register',headers=CSRF,json={**LOGIN,'name':'Test User','role':'admin'})
    assert r.status_code==200 and r.json()['user']['role']=='researcher'
    with accounts.Session(repo.engine) as session:
        user=session.scalar(accounts.select(accounts.Account))
        assert user.password != LOGIN['password'] and accounts.check_password(LOGIN['password'],user.password)

def test_session_cookie_logout_and_revocation(client):
    response=sign_in(client)
    assert response.status_code==200
    assert 'HttpOnly' in response.headers['set-cookie'] and 'SameSite=strict' in response.headers['set-cookie']
    token=client.cookies.get(accounts.COOKIE)
    assert client.get('/api/v1/auth/me').status_code==200
    assert client.post('/api/v1/auth/logout',headers=CSRF).status_code==200
    assert client.get('/api/v1/auth/me').status_code==401
    client.cookies.set(accounts.COOKIE,token)
    assert client.get('/api/v1/auth/me').status_code==401

def test_researcher_can_submit_but_not_review_or_read_enquiries(client):
    sign_in(client)
    result=client.post('/api/v1/resources',headers=CSRF,json=META)
    assert result.status_code==200
    rid=result.json()['resource']['id']
    assert client.post(f'/api/v1/resources/{rid}/review',headers=CSRF).status_code==403
    assert client.get('/api/v1/enquiries',headers=CSRF).status_code==403

def test_admin_can_review_and_read_enquiries(client):
    sign_in(client,'admin')
    rid=client.post('/api/v1/resources',headers=CSRF,json=META).json()['resource']['id']
    assert client.post(f'/api/v1/resources/{rid}/review',headers=CSRF).status_code==200
    assert client.get('/api/v1/enquiries',headers=CSRF).status_code==200

def test_cookie_mutation_requires_custom_header(client):
    sign_in(client)
    assert client.post('/api/v1/resources',json=META).status_code==403
    assert client.post('/api/v1/auth/logout').status_code==403

def test_invalid_login_and_duplicate_registration(client):
    sign_in(client)
    assert client.post('/api/v1/auth/login',headers=CSRF,json={**LOGIN,'password':'incorrect-password'}).status_code==401
    assert client.post('/api/v1/auth/register',headers=CSRF,json={**LOGIN,'name':'Test User'}).status_code==409

def test_expired_session_is_rejected(client):
    sign_in(client)
    with accounts.Session(repo.engine) as session:
        login=session.scalar(accounts.select(accounts.LoginSession));login.expires=0;session.commit()
    assert client.get('/api/v1/auth/me').status_code==401
def test_unsupported_question(client): assert client.post('/api/v1/ask',json={'query':'tropical flamingo breeding'}).json()['status']=='insufficient_evidence'
def test_write_requires_auth(client): assert client.post('/api/v1/resources',json=META).status_code==401
def test_disabled_auth_without_token(client,monkeypatch):
    monkeypatch.delenv('CURATOR_TOKEN');assert client.post('/api/v1/resources',headers=AUTH,json=META).status_code==401
def test_original_file_and_provenance(client):
    r=upload(client).json()['resource'];detail=client.get('/api/v1/resources/'+r['id']).json()
    assert detail['sha256']==hashlib.sha256(TEXT).hexdigest()
    assert detail['chunks'][0]['document_id']==r['id']
    assert detail['chunks'][0]['page'] is None
    assert client.get(r['file_url']).content==TEXT
    assert 'filename' not in detail
def test_duplicate_is_idempotent(client):
    a=upload(client).json();b=upload(client).json()
    assert a['resource']['id']==b['resource']['id'] and b['duplicate']
    assert client.get('/api/v1/resources').json()['count']==1
def test_bad_pdf(client): assert upload(client,b'not PDF','bad.pdf').status_code==422
def test_rights_required(client): assert upload(client,metadata={**META,'rights_confirmed':False}).status_code==422
def test_executable_rejected(client): assert upload(client,b'MZ123','program.exe').status_code==422
def test_review_gate(client):
    r=upload(client).json()['resource'];query={'query':'Himadri aerosol sampling'}
    assert client.post('/api/v1/ask',json=query).json()['status']=='insufficient_evidence'
    client.post(f"/api/v1/resources/{r['id']}/review",headers=AUTH)
    result=client.post('/api/v1/ask',json=query).json()
    assert result['status']=='source_excerpts' and result['evidence'][0]['document_id']==r['id']
    assert result['evidence'][0]['semantic_score'] is None
def test_unknown_parameter_refused(client):
    r=upload(client).json()['resource'];client.post(f"/api/v1/resources/{r['id']}/review",headers=AUTH)
    assert client.post('/api/v1/ask',json={'query':'Himadri nuclear reactor temperature'}).json()['status']=='insufficient_evidence'
def test_draft_persists_and_original_unchanged(client):
    r=upload(client).json()['resource'];client.post(f"/api/v1/resources/{r['id']}/review",headers=AUTH)
    result=client.post('/api/v1/generate',json={'source_ids':[r['id']],'audience':'students','format':'explainer'})
    assert result.status_code==200
    draft=result.json();assert draft['is_draft'] and draft['provider']=='extractive-template'
    assert client.get('/api/v1/drafts/'+draft['id']).json()==draft
    assert client.get(r['file_url']).content==TEXT
def test_missing_resource(client): assert client.get('/api/v1/resources/absent').status_code==404
def test_metadata_only_has_no_file(client):
    r=client.post('/api/v1/resources',json=META,headers=AUTH).json()['resource']
    assert r['file_url'] is None
    assert client.get('/api/v1/resources/'+r['id']+'/file').status_code==404

def test_enquiry_is_private(client):
    response=client.post('/api/v1/enquiries',json={'name':'Test User','email':'test@example.org','message':'Please correct this source record.'})
    assert response.status_code==200
    assert client.get('/api/v1/enquiries').status_code==401
    stored=client.get('/api/v1/enquiries',headers=AUTH).json()
    assert stored[0]['id']==response.json()['id']

def test_rate_limit(client):
    for _ in range(12): assert client.post('/api/v1/ask',json={'query':'flamingos'}).status_code==200
    assert client.post('/api/v1/ask',json={'query':'flamingos'}).status_code==429

def test_pdf_physical_page_preserved(client):
    from pypdf import PdfWriter
    from pypdf.generic import DictionaryObject,NameObject,DecodedStreamObject
    import io
    writer=PdfWriter();writer.add_blank_page(width=200,height=200);page=writer.add_blank_page(width=200,height=200)
    font=DictionaryObject({NameObject('/Type'):NameObject('/Font'),NameObject('/Subtype'):NameObject('/Type1'),NameObject('/BaseFont'):NameObject('/Helvetica')})
    page[NameObject('/Resources')]=DictionaryObject({NameObject('/Font'):DictionaryObject({NameObject('/F1'):writer._add_object(font)})})
    stream=DecodedStreamObject();stream.set_data(b'BT /F1 12 Tf 10 100 Td (Himadri aerosol test observations) Tj ET')
    page[NameObject('/Contents')]=writer._add_object(stream)
    output=io.BytesIO();writer.write(output)
    r=upload(client,output.getvalue(),'source.pdf').json()['resource']
    chunks=client.get('/api/v1/resources/'+r['id']).json()['chunks']
    assert chunks[0]['page']==2 and 'Himadri' in chunks[0]['text']

def test_uncited_generation_is_rejected(client,monkeypatch):
    r=upload(client).json()['resource'];client.post(f"/api/v1/resources/{r['id']}/review",headers=AUTH)
    async def fake(_, has_evidence=None): return 'An unsupported fluent answer without citations.'
    monkeypatch.setattr(repo,'generate',fake)
    assert client.post('/api/v1/ask',json={'query':'Himadri aerosol sampling'}).json()['status']=='insufficient_evidence'
