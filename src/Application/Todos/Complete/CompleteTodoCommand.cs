using Application.Abstractions.Messaging;

namespace Application.Todos.Complete;

public sealed record CompleteTodoCommand(Guid TodoItemId, string? Notes = null) : ICommand;
