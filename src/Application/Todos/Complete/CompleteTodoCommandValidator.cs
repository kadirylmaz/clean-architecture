using FluentValidation;

namespace Application.Todos.Complete;

internal sealed class CompleteTodoCommandValidator : AbstractValidator<CompleteTodoCommand>
{
    public CompleteTodoCommandValidator()
    {
        RuleFor(c => c.TodoItemId).NotEmpty();
        RuleFor(c => c.Notes).MaximumLength(1000).When(c => c.Notes is not null);
    }
}
