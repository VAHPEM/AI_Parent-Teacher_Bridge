# AI_Parent-Teacher_Bridge

## How to run (local dev)

### Client (React + Vite)

```bash
cd client
npm install
npm run dev
```

Then open the URL Vite prints (typically `http://localhost:5173`).

### Server (FastAPI)

The `server/` folder currently contains `requirements.txt` (and a local `.venv/`), but **no FastAPI source code / entrypoint** (`.py` files). Once an app exists (e.g. `server/main.py` with `app = FastAPI()`), you’ll be able to run it like:

```bash
cd server
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```