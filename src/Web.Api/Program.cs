using System.Reflection;
using Application;
using HealthChecks.UI.Client;
using Infrastructure;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Serilog;
using Serilog.Sinks.OpenTelemetry;
using Web.Api;
using Web.Api.Extensions;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, services, loggerConfig) =>
{
    loggerConfig
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services);

    // Same endpoint the OpenTelemetry SDK uses for traces/metrics (see AddObservability) — logs are
    // exported independently via Serilog's own OTLP sink so trace_id/span_id correlation comes from
    // whichever Activity is current, without a second Microsoft.Extensions.Logging pipeline.
    string? otlpEndpoint = context.Configuration["OTEL_EXPORTER_OTLP_ENDPOINT"];

    if (!string.IsNullOrWhiteSpace(otlpEndpoint))
    {
        loggerConfig.WriteTo.OpenTelemetry(options =>
        {
            options.Endpoint = otlpEndpoint;
            options.Protocol = OtlpProtocol.Grpc;
            options.ResourceAttributes = new Dictionary<string, object>
            {
                ["service.name"] = context.HostingEnvironment.ApplicationName,
                ["deployment.environment"] = context.HostingEnvironment.EnvironmentName
            };
        });
    }
});

builder.Services.AddSwaggerGenWithAuth();

builder.Services
    .AddApplication()
    .AddPresentation(builder.Configuration)
    .AddInfrastructure(builder.Configuration);

builder.Services.AddObservability(
    builder.Configuration,
    builder.Environment.ApplicationName,
    builder.Environment.EnvironmentName);

builder.Services.AddRateLimitingInternal(builder.Configuration);

builder.Services.AddEndpoints(Assembly.GetExecutingAssembly());

WebApplication app = builder.Build();

app.MapEndpoints();

if (app.Environment.IsDevelopment())
{
    app.UseSwaggerWithUi();

    app.ApplyMigrations();
}

app.MapHealthChecks("health", new HealthCheckOptions
{
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});

app.UseRequestContextLogging();

app.UseSerilogRequestLogging();

app.UseExceptionHandler();

app.UseCors(Web.Api.DependencyInjection.CorsPolicyName);

app.UseAuthentication();

app.UseAuthorization();

app.UseRateLimiter();

// REMARK: If you want to use Controllers, you'll need this.
app.MapControllers();

await app.RunAsync();

// REMARK: Required for functional and integration tests to work.
namespace Web.Api
{
    public partial class Program;
}
