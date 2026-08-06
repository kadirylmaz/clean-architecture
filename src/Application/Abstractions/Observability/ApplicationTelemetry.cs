using System.Diagnostics;
using System.Diagnostics.Metrics;

namespace Application.Abstractions.Observability;

/// <summary>
/// Use-case-level tracing and metrics for the Application layer.
/// </summary>
/// <remarks>
/// This lives in the Application layer (System.Diagnostics is part of the BCL, not a Web.Api/Infrastructure
/// concern) so every command/query handler gets a span + duration/outcome metric "for free" via
/// <see cref="Behaviors.LoggingDecorator"/>, without any OpenTelemetry package reference in this project.
/// Web.Api's <c>OpenTelemetryExtensions</c> subscribes to <see cref="ActivitySourceName"/> and
/// <see cref="MeterName"/> so these show up in traces/metrics exported via OTLP.
/// </remarks>
public static class ApplicationTelemetry
{
    public const string ActivitySourceName = "CleanArchitecture.Application";
    public const string MeterName = "CleanArchitecture.Application";

    internal static readonly ActivitySource ActivitySource = new(ActivitySourceName);

    private static readonly Meter Meter = new(MeterName);

    /// <summary>Duration of a single command/query handler execution, tagged by use case and outcome.</summary>
    internal static readonly Histogram<double> UseCaseDuration = Meter.CreateHistogram<double>(
        "app.use_case.duration",
        unit: "ms",
        description: "Duration of an application use case (command/query) execution.");

    /// <summary>Count of use cases that completed with a failure Result, tagged by use case and error code.</summary>
    internal static readonly Counter<long> UseCaseFailures = Meter.CreateCounter<long>(
        "app.use_case.failures",
        description: "Number of use cases that completed with a failure Result.");
}
