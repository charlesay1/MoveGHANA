# Observability (Baseline)

## API logging
- Structured JSON logs with: requestId, method, path, statusCode, durationMs
- `x-request-id` is returned in responses and included in errors

## Health checks
- `GET /health` returns status, service, version, env, timestamp

## Planned additions (later)
- Distributed tracing
- Centralized log aggregation
- Metrics dashboard
