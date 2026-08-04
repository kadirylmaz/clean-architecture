# Test Şablonları

Yığın: xUnit + Shouldly + NSubstitute (unit), FluentValidation.TestHelper (validator'lar), WebApplicationFactory + Testcontainers (integration). Her yeni use case üçünü de alır.

## Handler unit testleri

`tests/Application.UnitTests/{Feature}/{UseCase}{Command|Query}HandlerTests.cs`. `BaseHandlerTest`'ten kalıtım al — bu, `CreateDbContext()` (in-memory `TestDbContext`, `IApplicationDbContext`'i uygular) ve `CreateCache()` (gerçek `HybridCache`) sağlar. Yalnızca arayüzleri (`IUserContext`, `IDateTimeProvider`) NSubstitute ile mock'la.

Kapsanacaklar: her başarısızlık yolu (guard clause başına bir test) ve kalıcı durum ile fırlatılan domain event'leri içeren happy path.

```csharp
using Application.Abstractions.Authentication;
using Application.Todos.Archive;
using Application.UnitTests.Abstractions;
using Domain.Todos;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.UnitTests.Todos;

public sealed class ArchiveTodoCommandHandlerTests : BaseHandlerTest
{
    private static readonly Guid UserId = Guid.NewGuid();

    [Fact]
    public async Task Handle_Should_ReturnNotFound_WhenTodoDoesNotExist()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        IUserContext userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(UserId);
        IDateTimeProvider dateTimeProvider = Substitute.For<IDateTimeProvider>();

        var command = new ArchiveTodoCommand(Guid.NewGuid());
        var handler = new ArchiveTodoCommandHandler(context, dateTimeProvider, userContext);

        // Act
        Result result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(TodoItemErrors.NotFound(command.TodoItemId));
    }

    [Fact]
    public async Task Handle_Should_ArchiveTodoAndRaiseDomainEvent_WhenValid()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var todoItem = new TodoItem
        {
            Id = Guid.NewGuid(),
            UserId = UserId,
            Description = "Archive me",
            CreatedAt = DateTime.UtcNow
        };
        context.TodoItems.Add(todoItem);
        await context.SaveChangesAsync();

        IUserContext userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(UserId);
        IDateTimeProvider dateTimeProvider = Substitute.For<IDateTimeProvider>();
        dateTimeProvider.UtcNow.Returns(DateTime.UtcNow);

        var command = new ArchiveTodoCommand(todoItem.Id);
        var handler = new ArchiveTodoCommandHandler(context, dateTimeProvider, userContext);

        // Act
        Result result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();

        TodoItem archived = await context.TodoItems.SingleAsync(t => t.Id == todoItem.Id);
        archived.IsArchived.ShouldBeTrue();
        archived.DomainEvents.ShouldContain(e => e is TodoItemArchivedDomainEvent);
    }
}
```

Kurallar:
- Test isimleri: `Handle_Should_{Outcome}_When{Condition}`.
- Her testte `// Arrange` / `// Act` / `// Assert` yorumları.
- Başarısızlıkları tam hata karşılaştırmasıyla assert et: `result.Error.ShouldBe(TodoItemErrors.NotFound(id))`.
- `GlobalUsings.cs` zaten `Xunit`, `NSubstitute`, `Shouldly` ve `SharedKernel`'i import eder — bu using'leri tekrar ekleme.
- Entity yeni property'ler kazanırsa, `TestDbContext` bunları otomatik olarak alır; yalnızca tamamen yeni bir `DbSet` eklerken dokun.

## Validator testleri

`tests/Application.UnitTests/{Feature}/{Feature}ValidatorsTests.cs` (varsa mevcut dosyayı genişlet). Bir sınıf, bir feature'ın tüm validator'larını kapsar.

```csharp
[Fact]
public void CreateValidator_Should_HaveError_WhenDescriptionIsEmpty()
{
    var command = new CreateTodoCommand
    {
        UserId = Guid.NewGuid(),
        Description = string.Empty,
        Priority = Priority.Low
    };

    TestValidationResult<CreateTodoCommand> result = _createValidator.TestValidate(command);

    result.ShouldHaveValidationErrorFor(c => c.Description);
}
```

Her kuralın başarısızlığını ve tamamen geçerli bir command'ı (`ShouldNotHaveAnyValidationErrors`) kapsa.

## Integration testleri

`tests/IntegrationTests/{Feature}/{Feature}Tests.cs` (varsa mevcut dosyayı genişlet). `BaseIntegrationTest(factory)`'den kalıtım al — bu, gerçek API'yi bir Testcontainers Postgres'e karşı çalıştırır ve `HttpClient`, `RegisterAndLoginAsync()`, `Authenticate(token)` sağlar. Testler gerçek HTTP üzerinden gider, handler'ları asla doğrudan çağırmaz.

```csharp
[Fact]
public async Task ArchiveTodo_Should_MarkTodoAsArchived()
{
    // Arrange
    (Guid userId, AccessTokens tokens) = await RegisterAndLoginAsync();
    Authenticate(tokens.AccessToken);

    var createRequest = new
    {
        userId,
        description = "Todo to archive",
        labels = Array.Empty<string>(),
        priority = 1
    };
    HttpResponseMessage createResponse = await HttpClient.PostAsJsonAsync("todos", createRequest);
    createResponse.EnsureSuccessStatusCode();
    Guid todoId = await createResponse.Content.ReadFromJsonAsync<Guid>();

    // Act
    HttpResponseMessage response = await HttpClient.PutAsync($"todos/{todoId}/archive", null);

    // Assert
    response.StatusCode.ShouldBe(HttpStatusCode.NoContent);
}
```

Endpoint başına minimum kapsama: yeni bir route ailesiyse bir unauthorized testi (token yok → 401), bir sonraki GET ile gözlemlenebilir durumu assert eden bir happy-path testi, ve handler'ın başarısızlık yolları varsa bir hata çevirisi testi (örn. bilinmeyen id → 404).

## Çalıştır

```
dotnet test
```

Integration testleri Docker'ın çalışır olmasını gerektirir (Testcontainers). Bir katman bağımlılık kuralı ihlal edilirse mimari testleri build'i başarısız kılar — testi değil, bağımlılığı düzelt.
