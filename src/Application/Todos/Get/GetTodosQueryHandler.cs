using Application.Abstractions.Authentication;
using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Domain.Todos;
using Domain.Users;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Todos.Get;

internal sealed class GetTodosQueryHandler(IApplicationDbContext context, IUserContext userContext)
    : IQueryHandler<GetTodosQuery, List<TodoResponse>>
{
    public async Task<Result<List<TodoResponse>>> Handle(GetTodosQuery query, CancellationToken cancellationToken)
    {
        if (!userContext.IsAdmin && query.UserId is not null && query.UserId != userContext.UserId)
        {
            return Result.Failure<List<TodoResponse>>(UserErrors.Unauthorized());
        }

        IQueryable<TodoItem> todoItemsQuery = context.TodoItems;

        if (!userContext.IsAdmin)
        {
            // Normal users only ever see their own todos, regardless of what userId was requested.
            todoItemsQuery = todoItemsQuery.Where(todoItem => todoItem.UserId == userContext.UserId);
        }
        else if (query.UserId is not null)
        {
            // Admins may narrow the view down to a specific user; omitting userId returns everyone's todos.
            todoItemsQuery = todoItemsQuery.Where(todoItem => todoItem.UserId == query.UserId);
        }

        List<TodoResponse> todos = await todoItemsQuery
            .Join(
                context.Users,
                todoItem => todoItem.UserId,
                user => user.Id,
                (todoItem, user) => new TodoResponse
                {
                    Id = todoItem.Id,
                    UserId = todoItem.UserId,
                    Description = todoItem.Description,
                    DueDate = todoItem.DueDate,
                    Labels = todoItem.Labels,
                    IsCompleted = todoItem.IsCompleted,
                    CreatedAt = todoItem.CreatedAt,
                    CompletedAt = todoItem.CompletedAt,
                    Priority = todoItem.Priority,
                    CompletionNotes = todoItem.CompletionNotes,
                    OwnerName = user.FirstName + " " + user.LastName
                })
            .ToListAsync(cancellationToken);

        return todos;
    }
}
