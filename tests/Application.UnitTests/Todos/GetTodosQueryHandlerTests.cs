using Application.Abstractions.Authentication;
using Application.Todos.Get;
using Application.UnitTests.Abstractions;
using Domain.Todos;
using SharedKernel;

namespace Application.UnitTests.Todos;

public sealed class GetTodosQueryHandlerTests : BaseHandlerTest
{
    private static readonly Guid UserId = Guid.NewGuid();
    private static readonly Guid OtherUserId = Guid.NewGuid();

    [Fact]
    public async Task Handle_Should_ReturnOnlyOwnTodos_WhenCallerIsNotAdmin()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        await SeedTodoAsync(context, UserId, "Mine");
        await SeedTodoAsync(context, OtherUserId, "Someone else's");

        IUserContext userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(UserId);
        userContext.IsAdmin.Returns(false);

        var handler = new GetTodosQueryHandler(context, userContext);
        var query = new GetTodosQuery(UserId);

        // Act
        Result<List<TodoResponse>> result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value.ShouldHaveSingleItem();
        result.Value.Single().Description.ShouldBe("Mine");
    }

    [Fact]
    public async Task Handle_Should_ReturnUnauthorized_WhenRequestingAnotherUsersTodos_AndCallerIsNotAdmin()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();

        IUserContext userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(UserId);
        userContext.IsAdmin.Returns(false);

        var handler = new GetTodosQueryHandler(context, userContext);
        var query = new GetTodosQuery(OtherUserId);

        // Act
        Result<List<TodoResponse>> result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(Domain.Users.UserErrors.Unauthorized());
    }

    [Fact]
    public async Task Handle_Should_ReturnEveryUsersTodos_WhenCallerIsAdmin_AndNoUserIdRequested()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        await SeedTodoAsync(context, UserId, "Mine");
        await SeedTodoAsync(context, OtherUserId, "Someone else's");

        IUserContext userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(UserId);
        userContext.IsAdmin.Returns(true);

        var handler = new GetTodosQueryHandler(context, userContext);
        var query = new GetTodosQuery(null);

        // Act
        Result<List<TodoResponse>> result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value.Count.ShouldBe(2);
    }

    [Fact]
    public async Task Handle_Should_ReturnOnlyRequestedUsersTodos_WhenCallerIsAdmin_AndUserIdRequested()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        await SeedTodoAsync(context, UserId, "Mine");
        await SeedTodoAsync(context, OtherUserId, "Someone else's");

        IUserContext userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(UserId);
        userContext.IsAdmin.Returns(true);

        var handler = new GetTodosQueryHandler(context, userContext);
        var query = new GetTodosQuery(OtherUserId);

        // Act
        Result<List<TodoResponse>> result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value.ShouldHaveSingleItem();
        result.Value.Single().Description.ShouldBe("Someone else's");
    }

    private static async Task SeedTodoAsync(TestDbContext context, Guid userId, string description)
    {
        var todoItem = new TodoItem
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Description = description,
            Priority = Priority.Normal,
            Labels = [],
            IsCompleted = false,
            CreatedAt = DateTime.UtcNow
        };

        context.TodoItems.Add(todoItem);
        await context.SaveChangesAsync();
    }
}
