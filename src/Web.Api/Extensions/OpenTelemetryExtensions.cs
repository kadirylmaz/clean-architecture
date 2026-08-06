using System.Reflection;
using Application.Abstractions.Observability;
using Npgsql;
using OpenTelemetry;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

namespace Web.Api.Extensions;

internal static class OpenTelemetryExtensions
{
    internal static IServiceCollection AddObservability(
        this IServiceCollection services,
        IConfiguration configuration,
        string serviceName,
        string environmentName)
    {
        string? serviceVersion = Assembly.GetExecutingAssembly().GetName().Version?.ToString();

        services.AddOpenTelemetry()
            .ConfigureResource(resource => resource
                .AddService(serviceName, serviceVersion: serviceVersion)
                .AddAttributes([new KeyValuePair<string, object>("deployment.environment", environmentName)]))
            .WithTracing(tracing => tracing
                // Application-layer use-case spans (Todos.Archive, Users.Login, ...) — see LoggingDecorator.
                .AddSource(ApplicationTelemetry.ActivitySourceName)
                // Incoming HTTP requests. RecordException also attaches unhandled-exception details
                // (message, stack trace) to the request span as an exception event.
                .AddAspNetCoreInstrumentation(o => o.RecordException = true)
                // Outgoing HTTP calls to other services — duration + status show up as child spans.
                .AddHttpClientInstrumentation(o => o.RecordException = true)
                // Database round-trips (query text, duration) as child spans of the request.
                .AddNpgsql())
            .WithMetrics(metrics => metrics
                // app.use_case.duration / app.use_case.failures — see LoggingDecorator.
                .AddMeter(ApplicationTelemetry.MeterName)
                .AddAspNetCoreInstrumentation()
                .AddHttpClientInstrumentation()
                .AddRuntimeInstrumentation());

        // Export traces + metrics to any OTLP-compatible backend (Aspire dashboard, the local
        // otel-collector -> Tempo/Prometheus, Jaeger, etc.) when an endpoint is configured via the
        // standard OTEL_EXPORTER_OTLP_ENDPOINT variable. Logs are exported separately, through
        // Serilog's own OpenTelemetry sink (see Program.cs), reusing the same endpoint.
        if (!string.IsNullOrWhiteSpace(configuration["OTEL_EXPORTER_OTLP_ENDPOINT"]))
        {
            services.AddOpenTelemetry().UseOtlpExporter();
        }

        return services;
    }
}
