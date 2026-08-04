# Query Dilimi Şablonları

Dosyalar `src/Application/{Feature}/{UseCase}/` içine gider. Query'ler okumadır: validator yok, domain event yok, `SaveChangesAsync` yok.

## Query

```csharp
using Application.Abstractions.Messaging;

namespace Application.Todos.GetOverdue;

public sealed record GetOverdueTodosQuery : IQuery<List<TodoResponse>>;
```

Parametrelerle: `public sealed record GetTodoByIdQuery(Guid TodoItemId) : IQuery<TodoResponse>;`

## Response DTO'su

Query'nin yanında yaşar. Düz, serialization için uygun, asla bir domain entity'si değil.

```csharp
namespace Application.Todos.GetOverdue;

public sealed class TodoResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Description { get; set; }
    public DateTime? DueDate { get; set; }
    public List<string> Labels { get; set; } = [];
    public bool IsCompleted { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}
```

Her use case klasörü kendi `TodoResponse`'una sahiptir — bugün aynı görünseler bile dilimler arasında DTO paylaşılmaz.

## Handler

Geçerli kullanıcıya kapsanır, `.Select` ile doğrudan DTO'ya projekte edilir:

```csharp
using Application.Abstractions.Authentication;
using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Todos.GetOverdue;

internal sealed class GetOverdueTodosQueryHandler(
    IApplicationDbContext context,
    IUserContext userContext,
    IDateTimeProvider dateTimeProvider)
    : IQueryHandler<GetOverdueTodosQuery, List<TodoResponse>>
{
    public async Task<Result<List<TodoResponse>>> Handle(
        GetOverdueTodosQuery query,
        CancellationToken cancellationToken)
    {
        List<TodoResponse> todos = await context.TodoItems
            .Where(todoItem => todoItem.UserId == userContext.UserId &&
                               !todoItem.IsCompleted &&
                               todoItem.DueDate < dateTimeProvider.UtcNow)
            .Select(todoItem => new TodoResponse
            {
                Id = todoItem.Id,
                UserId = todoItem.UserId,
                Description = todoItem.Description,
                DueDate = todoItem.DueDate,
                Labels = todoItem.Labels,
                IsCompleted = todoItem.IsCompleted,
                CreatedAt = todoItem.CreatedAt,
                CompletedAt = todoItem.CompletedAt
            })
            .ToListAsync(cancellationToken);

        return todos;
    }
}
```

Tek öğe sorguları için, hiçbir şey eşleşmediğinde `Result.Failure<TodoResponse>(TodoItemErrors.NotFound(id))` döndür.

## Cache'leme (isteğe bağlı, yalnızca sık okunanlar için)

Veritabanı sorgusunu, feature'ın cache-keys sınıfından bir key ile `HybridCache.GetOrCreateAsync` içine sar (canlı örnek için `GetTodoByIdQueryHandler`'a bak):

```csharp
namespace Application.Todos;

internal static class TodoCacheKeys
{
    internal static string ById(Guid userId, Guid todoItemId) => $"todos-{userId}-{todoItemId}";
}
```

```csharp
TodoResponse? todo = await cache.GetOrCreateAsync(
    TodoCacheKeys.ById(userId, query.TodoItemId),
    async cancellation => await context.TodoItems
        .Where(...)
        .Select(...)
        .SingleOrDefaultAsync(cancellation),
    cancellationToken: cancellationToken);
```

Cache'lenmiş veriyi değiştiren her command aynı key'i `cache.RemoveAsync(...)` ile geçersiz kılmalıdır. Etkilenen key'leri sayamıyorsan, cache'leme.
