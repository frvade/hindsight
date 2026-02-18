FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc && \
    rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir hindsight-api

# Create non-root user
RUN useradd -r -m hindsight
USER hindsight
WORKDIR /home/hindsight

EXPOSE 8888

CMD ["hindsight-api"]
