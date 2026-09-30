"""Load optional local credentials without exposing them to the frontend."""
import json
import os
from pathlib import Path

local_config = Path(__file__).resolve().parents[1] / '.gemini.local'
if local_config.is_file():
    values = json.loads(local_config.read_text(encoding='utf-8'))
    for name in ('GEMINI_API_KEY', 'GEMINI_MODEL'):
        if isinstance(values.get(name), str):
            os.environ.setdefault(name, values[name])

from .repository import app
from . import accounts  # Register session/account endpoints.
from . import catalog  # Register production-core catalogue and permitted media endpoints.
