# Endpoint Şablonları

`src/Web.Api/Endpoints/{Feature}/{UseCase}.cs` içinde use case başına bir dosya. Endpoint'ler `IEndpoint`'i uygular ve `AddEndpoints`/`MapEndpoints` tarafından otomatik olarak keşfedilir — kayıt gerekmez.

## Yanıt gövdesi olan command (POST → 200 + değer)

```csharp
using Application.Abstractions.Messaging;
using Application.Todos.Create;
using Domain.Todos;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Todos;

internal sealed class Create : IEndpoint
{
    public sealed class Request
    {
        public Guid UserId { get; set; }
        public string Description { get; set; }
        public DateTime? DueDate { get; set; }
        public List<string> Labels { get; set; } = [];
        public int Priority { get; set; }
    }

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("todos", async (
            Request request,
            ICommandHandler<CreateTodoCommand, Guid> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new CreateTodoCommand
            {
                UserId = request.UserId,
                Description = request.Description,
                DueDate = request.DueDate,
                Labels = request.Labels,
                Priority = (Priority)request.Priority
            };

            Result<Guid> result = await handler.Handle(command, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Todos)
        .RequireAuthorization();
    }
}
```

## Route parametresinden void command (PUT/DELETE → 204)

```csharp
using Application.Abstractions.Messaging;
using Application.Todos.Archive;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Todos;

internal sealed class Archive : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPut("todos/{id:guid}/archive", async (
            Guid id,
            ICommandHandler<ArchiveTodoCommand> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new ArchiveTodoCommand(id);

            Result result = await handler.Handle(command, cancellationToken);

            return result.Match(Results.NoContent, CustomResults.Problem);
        })
        .WithTags(Tags.Todos)
        .RequireAuthorization();
    }
}
```

## Query (GET → 200)

```csharp
using Application.Abstractions.Messaging;
using Application.Todos.GetOverdue;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Todos;

internal sealed class GetOverdue : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("todos/overdue", async (
            IQueryHandler<GetOverdueTodosQuery, List<TodoResponse>> handler,
            CancellationToken cancellationToken) =>
        {
            var query = new GetOverdueTodosQuery();

            Result<List<TodoResponse>> result = await handler.Handle(query, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Todos)
        .RequireAuthorization();
    }
}
```

## Kurallar

- Route'lar küçük harf, çoğul, başında slash yok: `todos`, `todos/{id:guid}`, `users/{userId:guid}/todos`. Tüm tipli parametrelerde route kısıtları (`:guid`).
- İç içe `Request` sınıfı yalnızca bir JSON gövdesi olduğunda vardır; lambda içinde command'a 1:1 eşlenir (enum değerleri `int` olarak gelir ve cast edilir).
- Handler arayüzünü (`ICommandHandler<...>` / `IQueryHandler<...>`) doğrudan bir lambda parametresi olarak çöz — decorate edilmiş örnek inject edilir.
- Her zaman `.WithTags(Tags.{Feature})` ve `.RequireAuthorization()` (veya bir permission sabiti varsa `.HasPermission(Permissions.X)`) ile bitir. Yeni ise feature sabitini `Tags.cs`'e ekle.
- Hatalar asla elle yazılmış yanıtlar almaz — `CustomResults.Problem`, `Error`'ı doğru durum koduyla RFC 7807 ProblemDetails'e çevirir.
