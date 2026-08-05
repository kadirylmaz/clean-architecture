using SharedKernel;

namespace Domain.Users;

public sealed class Role : Entity
{
    public static readonly Role Registered = new()
    {
        Id = new Guid("9f0a1b1e-3b0a-4a1e-8c1a-000000000001"),
        Name = "Registered"
    };

    public static readonly Role Administrator = new()
    {
        Id = new Guid("9f0a1b1e-3b0a-4a1e-8c1a-000000000002"),
        Name = "Administrator"
    };

    public Guid Id { get; set; }
    public string Name { get; set; }
}
