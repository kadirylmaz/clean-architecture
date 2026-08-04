# Command Dilimi Şablonları

Dosyalar `src/Application/{Feature}/{UseCase}/` içine gider. `{Feature}` (çoğul, örn. `Todos`), `{Entity}` (örn. `TodoItem`) ve use case isimlerini her yerde değiştir.

## Command

Az parametre için pozisyonel record:

```csharp
using Application.Abstractions.Messaging;

namespace Application.Todos.Archive;

public sealed record ArchiveTodoCommand(Guid TodoItemId) : ICommand;
```

Çok parametre olduğunda init-style setter'lı sınıf (`CreateTodoCommand` ile eşleşir):

```csharp
using Application.Abstractions.Messaging;
using Domain.Todos;

namespace Application.Todos.Create;

public sealed class CreateTodoCommand : ICommand<Guid>
{
    public Guid UserId { get; set; }
    public string Description { get; set; }
    public DateTime? DueDate { get; set; }
    public List<string> Labels { get; set; } = [];
    public Priority Priority { get; set; }
}
```

- `ICommand` → handler `Result` döndürür (endpoint `204 NoContent` yanıtı verir).
- `ICommand<TResponse>` → handler `Result<TResponse>` döndürür (endpoint `200 Ok` yanıtı verir).

## Validator

Public sınıf, aynı klasörde. `ValidationDecorator` tarafından handler çalışmadan önce otomatik olarak kaydedilir ve çalıştırılır.

```csharp
using FluentValidation;

namespace Application.Todos.Create;

public class CreateTodoCommandValidator : AbstractValidator<CreateTodoCommand>
{
    public CreateTodoCommandValidator()
    {
        RuleFor(c => c.UserId).NotEmpty();
        RuleFor(c => c.Priority).IsInEnum();
        RuleFor(c => c.Description).NotEmpty().MaximumLength(255);
        RuleFor(c => c.DueDate).GreaterThanOrEqualTo(DateTime.Today).When(x => x.DueDate.HasValue);
    }
}
```

## Handler

`internal sealed`, primary constructor, veri erişimi için `IApplicationDbContext`. Guard clause'lar Domain hatalarıyla `Result.Failure` döndürür; happy path değişiklik yapar, bir domain event fırlatır, kaydeder ve döner.

```csharp
using Application.Abstractions.Authentication;
using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Domain.Todos;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Todos.Archive;

internal sealed class ArchiveTodoCommandHandler(
    IApplicationDbContext context,
    IDateTimeProvider dateTimeProvider,
    IUserContext userContext)
    : ICommandHandler<ArchiveTodoCommand>
{
    public async Task<Result> Handle(ArchiveTodoCommand command, CancellationToken cancellationToken)
    {
        TodoItem? todoItem = await context.TodoItems
            .SingleOrDefaultAsync(
                t => t.Id == command.TodoItemId && t.UserId == userContext.UserId,
                cancellationToken);

        if (todoItem is null)
        {
            return Result.Failure(TodoItemErrors.NotFound(command.TodoItemId));
        }

        if (todoItem.IsArchived)
        {
            return Result.Failure(TodoItemErrors.AlreadyArchived(command.TodoItemId));
        }

        todoItem.IsArchived = true;
        todoItem.ArchivedAt = dateTimeProvider.UtcNow;

        todoItem.Raise(new TodoItemArchivedDomainEvent(todoItem.Id));

        await context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
```

Notlar:
- Sahiplik: sorguda `userContext.UserId`'e göre filtrele (tercih edilen) veya açıkça karşılaştır ve `Result.Failure(UserErrors.Unauthorized())` döndür.
- Zaman damgaları için `SharedKernel`'den `IDateTimeProvider` — asla doğrudan `DateTime.UtcNow` kullanma.
- Command cache'lenmiş sorgu verisini geçersiz kılıyorsa, `HybridCache`'i inject et ve kaydettikten sonra `cache.RemoveAsync({Feature}CacheKeys.X(...), cancellationToken)` çağır.
- Değer döndüren bir command için (`ICommand<Guid>`), değeri doğrudan döndür — `Result<T>`'nin örtük bir dönüşümü var: `return todoItem.Id;`.

## Domain Eklemeleri (gerekirse)

`src/Domain/{Feature}/` içindeki mevcut `{Entity}Errors` sınıfına hata fabrikası:

```csharp
public static Error AlreadyArchived(Guid todoItemId) => Error.Problem(
    "TodoItems.AlreadyArchived",
    $"The todo item with Id = '{todoItemId}' is already archived.");
```

Hata tipi → HTTP durumu (`CustomResults.Problem` aracılığıyla): `NotFound` → 404, `Conflict` → 409, `Problem`/`Validation` → 400, `Failure` → 500.

Domain event, `src/Domain/{Feature}/` içinde her biri için bir dosya:

```csharp
using SharedKernel;

namespace Domain.Todos;

public sealed record TodoItemArchivedDomainEvent(Guid TodoItemId) : IDomainEvent;
```

İsteğe bağlı event handler'ı (Application katmanı, use case klasöründe):

```csharp
using Domain.Todos;
using SharedKernel;

namespace Application.Todos.Archive;

internal sealed class TodoItemArchivedDomainEventHandler : IDomainEventHandler<TodoItemArchivedDomainEvent>
{
    public Task Handle(TodoItemArchivedDomainEvent domainEvent, CancellationToken cancellationToken)
    {
        // Yan etkiler buraya (bildirimler, projeksiyonlar, ...)
        return Task.CompletedTask;
    }
}
```
