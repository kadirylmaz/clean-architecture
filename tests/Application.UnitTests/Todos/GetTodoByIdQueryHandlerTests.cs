using Application.Abstractions.Authentication;
using Application.Todos.GetById;
using Application.UnitTests.Abstractions;
using Domain.Todos;
using Domain.Users;
using Microsoft.Extensions.Caching.Hybrid;
using SharedKernel;

namespace Application.UnitTests.Todos;

public sealed class GetTodoByIdQueryHandlerTests : BaseHandlerTest
{
    private static readonly Guid UserId = Guid.NewGuid();

    [Fact]
    public async Task Handle_Should_ReturnNotFound_WhenTodoDoesNotExist()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        HybridCache cache = CreateCache();
        IUserContext userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(UserId);

        var handler = new GetTodoByIdQueryHandler(context, userContext, cache);
        var query = new GetTodoByIdQuery(Guid.NewGuid());

        // Act
        Result<TodoResponse> result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.Code.ShouldBe("TodoItems.NotFound");
    }

    [Fact]
    public async Task Handle_Should_ReturnTodo_WhenItExistsForTheCurrentUser()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        await SeedOwnerAsync(context, UserId);
        var todoItem = new TodoItem
        {
            Id = Guid.NewGuid(),
            UserId = UserId,
            Description = "Cached todo",
            Priority = Priority.High,
            Labels = ["important"],
            IsCompleted = false,
            CreatedAt = DateTime.UtcNow
        };
        context.TodoItems.Add(todoItem);
        await context.SaveChangesAsync();

        HybridCache cache = CreateCache();
        IUserContext userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(UserId);

        var handler = new GetTodoByIdQueryHandler(context, userContext, cache);
        var query = new GetTodoByIdQuery(todoItem.Id);

        // Act
        Result<TodoResponse> result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value.Id.ShouldBe(todoItem.Id);
        result.Value.Description.ShouldBe("Cached todo");
    }

    [Fact]
    public async Task Handle_Should_ReturnNotFound_WhenTodoBelongsToAnotherUser_AndCallerIsNotAdmin()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var todoItem = new TodoItem
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Description = "Someone else's todo",
            Priority = Priority.Normal,
            Labels = [],
            IsCompleted = false,
            CreatedAt = DateTime.UtcNow
        };
        context.TodoItems.Add(todoItem);
        await context.SaveChangesAsync();

        HybridCache cache = CreateCache();
        IUserContext userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(UserId);
        userContext.IsAdmin.Returns(false);

        var handler = new GetTodoByIdQueryHandler(context, userContext, cache);
        var query = new GetTodoByIdQuery(todoItem.Id);

        // Act
        Result<TodoResponse> result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.Code.ShouldBe("TodoItems.NotFound");
    }

    [Fact]
    public async Task Handle_Should_ReturnTodo_WhenItBelongsToAnotherUser_AndCallerIsAdmin()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var ownerId = Guid.NewGuid();
        await SeedOwnerAsync(context, ownerId);
        var todoItem = new TodoItem
        {
            Id = Guid.NewGuid(),
            UserId = ownerId,
            Description = "Someone else's todo",
            Priority = Priority.Normal,
            Labels = [],
            IsCompleted = false,
            CreatedAt = DateTime.UtcNow
        };
        context.TodoItems.Add(todoItem);
        await context.SaveChangesAsync();

        HybridCache cache = CreateCache();
        IUserContext userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(UserId);
        userContext.IsAdmin.Returns(true);

        var handler = new GetTodoByIdQueryHandler(context, userContext, cache);
        var query = new GetTodoByIdQuery(todoItem.Id);

        // Act
        Result<TodoResponse> result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value.Id.ShouldBe(todoItem.Id);
    }

    private static async Task SeedOwnerAsync(TestDbContext context, Guid ownerId)
    {
        context.Users.Add(new User
        {
            Id = ownerId,
            Email = $"{ownerId}@example.com",
            FirstName = "Test",
            LastName = "User",
            PasswordHash = "hash"
        });

        await context.SaveChangesAsync();
    }
}
