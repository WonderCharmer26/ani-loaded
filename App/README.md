# AniLoaded

## Start Here

Read `CODEBASE_MAP.md` first for the architecture overview, file map, feature responsibilities, and quick project catch-up guide.

## Create your virtual environment

python -m venv venv

## Activate virtual environment

### Since we're on Mac:

source venv/bin/activate

## Install Dependencies

pip install -r requirements.txt

## If your installing any other packages

pip install package-name
pip freeze > requirements.txt
git add requirements.txt
git commit -m "Add package-name dependency"

## After your done working

type "deactivate" in the same terminal you opened to launch the venv

## Docker development (frontend + backend)

Use Docker Compose for cross-OS local development with live reload:

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000

Stop containers:

```bash
docker compose down
```
