FROM python:3.12

WORKDIR /app

COPY pyproject.toml pyproject.toml
COPY README.md README.md

RUN pip install poetry \
    && poetry config virtualenvs.in-project true \
    && poetry install --no-interaction --no-ansi --no-root

COPY src src

ENV PATH="/app/.venv/bin:$PATH"

CMD ["python", "src/start_a2a.py"]
