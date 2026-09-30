"""Build a public-only offline catalogue from reproducible seeds, never user data."""
import json, os, shutil, sqlite3, subprocess, sys, tempfile, zipfile
from pathlib import Path
root = Path(__file__).resolve().parents[1]
output = root / 'public' / 'catalogue'
output.mkdir(exist_ok=True)
with tempfile.TemporaryDirectory(prefix='dakshin-catalogue-') as temporary:
    storage = Path(temporary)
    env = {**os.environ, 'STORAGE_DIR': str(storage), 'DATABASE_URL': 'sqlite:///' + str(storage / 'repository.sqlite')}
    # Reuse the previously verified public-only release, not the live private database.
    with zipfile.ZipFile(root.parent/'Dakshinsetu-SIH26-release.zip') as archive:
        for name in archive.namelist():
            if name.startswith('Dakshinsetu/backend/storage/') and not name.endswith('/'):
                (storage/Path(name).name).write_bytes(archive.read(name))
    connection = sqlite3.connect(storage/'repository.sqlite')
    records = []
    for rid, data, chunks, filename in connection.execute('select id,data,chunks,filename from resources'):
        record = dict(json.loads(data), id=rid, chunks=json.loads(chunks))
        record['chunk_count'] = len(record['chunks'])
        record['file_url'] = None
        if filename:
            source = storage / filename
            if source.exists():
                target = rid + source.suffix
                shutil.copyfile(source, output/target)
                record['file_url'] = '/catalogue/' + target
        records.append(record)
    connection.close()
    (output/'records.json').write_text(json.dumps({'items': records, 'count': len(records)}, ensure_ascii=False), encoding='utf-8')
    print(f'Exported {len(records)} public records with permitted originals.')
