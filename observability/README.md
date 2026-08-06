# Observability

Web.Api ships full OpenTelemetry instrumentation (traces, metrics, logs) and this folder holds a
local "LGTM"-style stack (Grafana + Loki + Tempo + Prometheus) to visualize it, wired up in
[docker-compose.yml](../docker-compose.yml).

## What gets measured

| Signal | Source | Where it ends up |
|---|---|---|
| Incoming HTTP request duration, rate, status code, route | `OpenTelemetry.Instrumentation.AspNetCore` | Prometheus (`http_server_request_duration_seconds_*`) |
| Outgoing HTTP calls to other services | `OpenTelemetry.Instrumentation.Http` | Prometheus (`http_client_request_duration_seconds_*`) + span in the trace |
| Database round-trips (query, duration) | `Npgsql.OpenTelemetry` | Span in the trace (`postgresql`) + auto-derived RED metrics via Tempo's metrics-generator (`traces_spanmetrics_*`) |
| Per use-case (command/query) duration + outcome | `Application.Abstractions.Observability.ApplicationTelemetry`, applied by every handler via `LoggingDecorator` | Prometheus (`app_use_case_duration_milliseconds_*`, `app_use_case_failures_total`) + a named span per use case (e.g. `RegisterUserCommand`) |
| .NET runtime (GC, thread pool, JIT, process memory) | `OpenTelemetry.Instrumentation.Runtime` | Prometheus (`dotnet_*`) |
| Structured logs, trace/span-correlated | Serilog -> `Serilog.Sinks.OpenTelemetry` | Loki (`trace_id`/`span_id` as structured metadata on every line) |

Every one of these travels over OTLP (`OTEL_EXPORTER_OTLP_ENDPOINT`, set in `docker-compose.yml`)
to the **otel-collector**, which fans out: traces -> Tempo, metrics -> Prometheus (scraped from the
collector's own `prometheus` exporter on :8889), logs -> Loki (native OTLP ingestion).

## Why a request ends up looking like this in Grafana

```
POST users/register                 <- AspNetCore span (the HTTP request itself)
  └─ RegisterUserCommand             <- Application-layer span (LoggingDecorator + ApplicationTelemetry)
       ├─ postgresql                 <- Npgsql span (SELECT — check for existing email)
       └─ postgresql                 <- Npgsql span (INSERT — the new user)
```

Each level has its own duration in the trace waterfall, so "how long did this request spend
talking to the database" is just the DB spans' durations, and "how much of the total time was our
own business logic" is the use-case span minus its children. Tempo's metrics-generator turns every
span name (`postgresql`, `RegisterUserCommand`, outgoing HTTP calls, ...) into a Prometheus RED
metric automatically — that's what feeds the "Downstream Dependencies" row on the dashboard,
with zero extra instrumentation.

## Running it

```
docker compose up -d --build
```

| UI | URL |
|---|---|
| Grafana (dashboard: *Clean Architecture / Web.Api — Observability*) | http://localhost:3001 (anonymous access enabled — no login) |
| Prometheus | http://localhost:9091 |
| Tempo | http://localhost:3200 |
| Loki | http://localhost:3100 |
| Seq (kept alongside, unrelated to this stack) | http://localhost:8081 |

> Ports for Grafana/Prometheus were moved to 3001/9091 (instead of the defaults 3000/9090) only to
> dodge a collision with another, unrelated project's containers on this particular machine. Free
> to move them back if that's not a concern for you.

## Dashboard

[`grafana/provisioning/dashboards/json/api-observability.json`](grafana/provisioning/dashboards/json/api-observability.json),
auto-provisioned on Grafana startup. Panels:

1. **HTTP — Incoming Requests**: request rate by route, p50/p95/p99 duration, 5xx error rate.
2. **Application Layer — Use Cases**: p95 duration and failure rate per command/query, broken down
   by domain error code (`Users.NotFoundByEmail`, `TodoItems.AlreadyArchived`, ...).
3. **Downstream Dependencies**: p95 latency and calls/sec per span name (DB queries, outgoing HTTP
   calls) — sourced from Tempo's span-metrics, not hand-written instrumentation.
4. **Logs & Runtime**: error/fatal logs (click a line's trace ID to jump to the full trace in
   Tempo), .NET process memory and GC heap size.

## Verified end-to-end

This wasn't just wired up and left untested — after standing up the stack, real traffic (including
a deliberately-failing login) was sent through the API and each signal was confirmed at the source:

- Prometheus has `app_use_case_duration_milliseconds_*`, `app_use_case_failures_total{use_case="LoginUserCommand",error_code="Users.NotFoundByEmail"}`, `http_server_request_duration_seconds_*`, `traces_spanmetrics_*`.
- Tempo returned a full trace for `POST users/register` with the exact `AspNetCore -> RegisterUserCommand -> postgresql (x2)` nesting described above.
- Loki has the corresponding `Completed command LoginUserCommand with error Users.NotFoundByEmail` log line, and its `trace_id` field matches — byte for byte — the `traceId` returned in that request's HTTP 404 `ProblemDetails` body.

## Known limitations / good follow-ups

- **Log -> trace click-through in the Logs panel**: `trace_id` arrives as Loki *structured
  metadata*, not as text inside the log line, so the `derivedFields` regex on the Loki datasource
  won't fire (regex-based derived fields only match the line's text). The *other* direction
  (open a trace in Tempo, view its correlated logs) works today, since that's a label-based Loki
  query. If you want the reverse direction clickable too, the cleanest fix is enriching Serilog's
  output template to also render the trace id into the message text.
- Images are pinned to specific versions except none use `:latest`, but versions were chosen
  without network access to double-check they're still current — bump as needed.
- `GF_AUTH_ANONYMOUS_ENABLED=true` is convenient for local use; turn it off (and set
  `GF_SECURITY_ADMIN_PASSWORD`) before this ever runs anywhere shared.
- Retention is effectively "whatever fits the local Docker volumes" — fine for local dev, not sized
  for a long-lived environment.
