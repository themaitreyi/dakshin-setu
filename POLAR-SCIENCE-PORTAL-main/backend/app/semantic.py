"""CPU embeddings with an explicitly prepared local model; never downloads during queries."""
import os
from pathlib import Path
from threading import Lock
MODEL='BAAI/bge-small-en-v1.5'
CACHE=Path(os.getenv('EMBEDDING_CACHE',str(Path(__file__).resolve().parents[1]/'models')))
_model=None
_failed=False
_lock=Lock()
_vectors={}
def enabled(): return (CACHE/'ready').exists() and os.getenv('SEMANTIC_SEARCH','1')=='1'
def score(query,chunks):
    global _model,_failed
    if not enabled() or _failed: return None
    try:
        with _lock:
            import numpy as np
            from fastembed import TextEmbedding
            if _model is None: _model=TextEmbedding(model_name=MODEL,cache_dir=str(CACHE),threads=2,local_files_only=True)
            missing=[c for c in chunks if c['chunk_id'] not in _vectors]
            for c,v in zip(missing,_model.embed(['passage: '+c['text'] for c in missing])):
                _vectors[c['chunk_id']]=v/(np.linalg.norm(v)+1e-12)
            q=next(_model.embed(['query: '+query]));q=q/(np.linalg.norm(q)+1e-12)
            return [round(float(np.dot(_vectors[c['chunk_id']],q)),4) for c in chunks]
    except Exception:
        _failed=True
        return None

def mode(): return 'BM25 + local BGE cosine' if enabled() and not _failed else 'BM25 lexical (semantic model unavailable)'
