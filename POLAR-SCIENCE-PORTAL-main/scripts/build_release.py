"""Build a shareable archive from an explicit allowlist and a fresh seeded database."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT.parent / 'Dakshinsetu-SIH26-release.zip'
TOP_FILES = ['package.json','package-lock.json','tsconfig.json','vite.config.ts','eslint.config.js',
             'components.json','.prettierrc','.prettierignore','.gitignore','.dockerignore','.env.example',
             'Dockerfile','compose.yaml','DEPLOYMENT.md','START-HERE.md','README.md']
FOLDERS = ['src','public','ref_pics','deploy','backend/app','backend/tests','backend/models']
BACKEND_FILES = ['requirements.txt','Dockerfile','.dockerignore','main.py','seed.py',
                 'seed_catalogue.py','prepare_model.py','create_admin.py','README.md']
MEDIA = ['arctic-sea-ice.jpg','arctic-sea-ice.mp4','penguin-beach.jpg','os-21-419-2025.pdf']

def allowed(path):
    if path.relative_to(ROOT).as_posix() == 'public/isea-44-report.pdf': return False
    if path.relative_to(ROOT).as_posix() in ('src/features/auth/session.ts','src/features/auth/useSession.ts'): return False
    return not any(part.startswith('.') or part in ('__pycache__','node_modules') for part in path.relative_to(ROOT).parts) and path.suffix != '.pyc'

def build():
    # A new DB is seeded from public inputs; never copy users, sessions, enquiries or uploaded data.
    with tempfile.TemporaryDirectory(prefix='dakshinsetu-release-') as temporary:
        env = dict(os.environ, STORAGE_DIR=temporary, SEMANTIC_SEARCH='0')
        env.pop('DATABASE_URL', None)
        if '--reuse-public-release' in sys.argv:
            with zipfile.ZipFile(OUTPUT) as previous:
                for name in previous.namelist():
                    if name.startswith('Dakshinsetu/backend/storage/') and not name.endswith('/'):
                        (Path(temporary)/Path(name).name).write_bytes(previous.read(name))
        else:
            for script in ['seed.py', 'seed_catalogue.py']:
                subprocess.run([sys.executable, str(ROOT/'backend'/script)], cwd=ROOT/'backend', env=env, check=True)
        files = [(ROOT/p,p) for p in TOP_FILES if (ROOT/p).is_file()]
        for folder in FOLDERS:
            files.extend((p,p.relative_to(ROOT).as_posix()) for p in (ROOT/folder).rglob('*') if p.is_file() and allowed(p))
        files.extend((ROOT/'backend'/p,'backend/'+p) for p in BACKEND_FILES if (ROOT/'backend'/p).is_file())
        files.extend((ROOT/'backend/imports'/p,'backend/imports/'+p) for p in MEDIA if (ROOT/'backend/imports'/p).is_file())
        files.extend((p,'backend/storage/'+p.name) for p in Path(temporary).iterdir() if p.is_file())
        files.append((Path(__file__),'scripts/build_release.py'))
        files.append((ROOT/'scripts/export_catalogue.py','scripts/export_catalogue.py'))
        secret_file=ROOT/'backend/.gemini.local'
        secret=json.loads(secret_file.read_text()).get('GEMINI_API_KEY','').encode() if secret_file.exists() else b''
        with zipfile.ZipFile(OUTPUT,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
            for path,name in files:
                content=path.read_bytes()
                if secret and secret in content: raise RuntimeError('Credential found in release input; archive rejected')
                archive.writestr('Dakshinsetu/'+name,content)
        with zipfile.ZipFile(OUTPUT) as archive:
            assert archive.testzip() is None
            assert not any(n.endswith(('.local','.env')) or '/.venv/' in n for n in archive.namelist())
            print(f'Release verified: {len(archive.namelist())} files, {OUTPUT.stat().st_size/1024/1024:.1f} MiB')
            print(OUTPUT)

if __name__ == '__main__': build()
