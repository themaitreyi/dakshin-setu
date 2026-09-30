from fastembed import TextEmbedding
from app.semantic import MODEL,CACHE
CACHE.mkdir(parents=True,exist_ok=True)
model=TextEmbedding(model_name=MODEL,cache_dir=str(CACHE),threads=2)
vector=next(model.embed(['Himalayan glacier mass balance']))
assert len(vector)==384
(CACHE/'ready').write_text(MODEL,encoding='utf-8')
print('Local 384-dimensional embedding model prepared. Queries can now run offline.')
