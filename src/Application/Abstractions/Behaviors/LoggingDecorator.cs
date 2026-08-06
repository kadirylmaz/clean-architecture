using System.Diagnostics;
using Application.Abstractions.Messaging;
using Application.Abstractions.Observability;
using Microsoft.Extensions.Logging;
using Serilog.Context;
using SharedKernel;

namespace Application.Abstractions.Behaviors;

internal static class LoggingDecorator
{
    internal sealed class CommandHandler<TCommand, TResponse>(
        ICommandHandler<TCommand, TResponse> innerHandler,
        ILogger<CommandHandler<TCommand, TResponse>> logger)
        : ICommandHandler<TCommand, TResponse>
        where TCommand : ICommand<TResponse>
    {
        public async Task<Result<TResponse>> Handle(TCommand command, CancellationToken cancellationToken)
        {
            string commandName = typeof(TCommand).Name;

            using Activity? activity = ApplicationTelemetry.ActivitySource.StartActivity(commandName);

            logger.LogInformation("Processing command {Command}", commandName);

            long startTimestamp = Stopwatch.GetTimestamp();

            Result<TResponse> result = await innerHandler.Handle(command, cancellationToken);

            TimeSpan elapsed = Stopwatch.GetElapsedTime(startTimestamp);

            RecordOutcome(activity, commandName, elapsed, result.IsSuccess, result.IsFailure ? result.Error : null);

            if (result.IsSuccess)
            {
                logger.LogInformation(
                    "Completed command {Command} in {ElapsedMilliseconds}ms",
                    commandName,
                    elapsed.TotalMilliseconds);
            }
            else
            {
                using (LogContext.PushProperty("Error", result.Error, true))
                {
                    logger.LogError(
                        "Completed command {Command} with error {ErrorCode} in {ElapsedMilliseconds}ms",
                        commandName,
                        result.Error.Code,
                        elapsed.TotalMilliseconds);
                }
            }

            return result;
        }
    }

    internal sealed class CommandBaseHandler<TCommand>(
        ICommandHandler<TCommand> innerHandler,
        ILogger<CommandBaseHandler<TCommand>> logger)
        : ICommandHandler<TCommand>
        where TCommand : ICommand
    {
        public async Task<Result> Handle(TCommand command, CancellationToken cancellationToken)
        {
            string commandName = typeof(TCommand).Name;

            using Activity? activity = ApplicationTelemetry.ActivitySource.StartActivity(commandName);

            logger.LogInformation("Processing command {Command}", commandName);

            long startTimestamp = Stopwatch.GetTimestamp();

            Result result = await innerHandler.Handle(command, cancellationToken);

            TimeSpan elapsed = Stopwatch.GetElapsedTime(startTimestamp);

            RecordOutcome(activity, commandName, elapsed, result.IsSuccess, result.IsFailure ? result.Error : null);

            if (result.IsSuccess)
            {
                logger.LogInformation(
                    "Completed command {Command} in {ElapsedMilliseconds}ms",
                    commandName,
                    elapsed.TotalMilliseconds);
            }
            else
            {
                using (LogContext.PushProperty("Error", result.Error, true))
                {
                    logger.LogError(
                        "Completed command {Command} with error {ErrorCode} in {ElapsedMilliseconds}ms",
                        commandName,
                        result.Error.Code,
                        elapsed.TotalMilliseconds);
                }
            }

            return result;
        }
    }

    internal sealed class QueryHandler<TQuery, TResponse>(
        IQueryHandler<TQuery, TResponse> innerHandler,
        ILogger<QueryHandler<TQuery, TResponse>> logger)
        : IQueryHandler<TQuery, TResponse>
        where TQuery : IQuery<TResponse>
    {
        public async Task<Result<TResponse>> Handle(TQuery query, CancellationToken cancellationToken)
        {
            string queryName = typeof(TQuery).Name;

            using Activity? activity = ApplicationTelemetry.ActivitySource.StartActivity(queryName);

            logger.LogInformation("Processing query {Query}", queryName);

            long startTimestamp = Stopwatch.GetTimestamp();

            Result<TResponse> result = await innerHandler.Handle(query, cancellationToken);

            TimeSpan elapsed = Stopwatch.GetElapsedTime(startTimestamp);

            RecordOutcome(activity, queryName, elapsed, result.IsSuccess, result.IsFailure ? result.Error : null);

            if (result.IsSuccess)
            {
                logger.LogInformation(
                    "Completed query {Query} in {ElapsedMilliseconds}ms",
                    queryName,
                    elapsed.TotalMilliseconds);
            }
            else
            {
                using (LogContext.PushProperty("Error", result.Error, true))
                {
                    logger.LogError(
                        "Completed query {Query} with error {ErrorCode} in {ElapsedMilliseconds}ms",
                        queryName,
                        result.Error.Code,
                        elapsed.TotalMilliseconds);
                }
            }

            return result;
        }
    }

    /// <summary>
    /// Records the use-case duration histogram and, on failure, marks the current use-case span as an
    /// error span (with the domain error attached) and increments the failure counter. Shared by all
    /// three handler shapes so every command/query gets identical trace/metric semantics.
    /// </summary>
    private static void RecordOutcome(
        Activity? activity,
        string useCaseName,
        TimeSpan elapsed,
        bool isSuccess,
        Error? error)
    {
        string outcome = isSuccess ? "success" : "failure";

        ApplicationTelemetry.UseCaseDuration.Record(
            elapsed.TotalMilliseconds,
            new TagList { { "use_case", useCaseName }, { "outcome", outcome } });

        if (isSuccess || error is null)
        {
            return;
        }

        activity?.SetStatus(ActivityStatusCode.Error, error.Description);
        activity?.SetTag("error.code", error.Code);
        activity?.SetTag("error.type", error.Type.ToString());

        ApplicationTelemetry.UseCaseFailures.Add(
            1,
            new TagList { { "use_case", useCaseName }, { "error_code", error.Code } });
    }
}
