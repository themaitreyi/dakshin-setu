FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
RUN useradd --create-home portal && mkdir /data && chown portal:portal /data
COPY --chown=portal:portal app ./app
COPY --chown=portal:portal seed.py ./seed.py
COPY --chown=portal:portal seed_catalogue.py create_admin.py ./
ENV STORAGE_DIR=/data
USER portal
EXPOSE 4000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "4000", "--limit-concurrency", "32"]
