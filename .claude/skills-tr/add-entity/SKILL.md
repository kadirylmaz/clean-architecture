---
name: add-entity
description: Clean Architecture şablonuna yeni bir domain entity'si ekler — entity sınıfı, hata kataloğu, domain event'leri, EF Core konfigürasyonu, DbContext bağlantısı ve migration. Kullanıcı bir entity, aggregate, domain modeli veya tablo eklemek istediğinde kullanılır.
argument-hint: <entity açıklaması, örn. "İsim, sahip ve todo listesi olan bir Project">
---

# Bir Domain Entity'si Ekle

`TodoItem` desenini takip ederek yeni bir entity oluştur ve her katmana bağla.

## Oluşturulacak/Değiştirilecek Dosyalar

1. **Entity** — `src/Domain/{Feature}/{Entity}.cs`

```csharp
using SharedKernel;

namespace Domain.Projects;

public sealed class Project : Entity
{
    public Guid Id { get; set; }
    public Guid OwnerId { get; set; }
    public string Name { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

`sealed class`, `Entity`'den kalıtım alır (bu ona `DomainEvents` + `Raise(...)` verir), `Guid Id`, düz set edilebilir property'ler, koleksiyonlar `= [];` ile başlatılır.

2. **Hata kataloğu** — `src/Domain/{Feature}/{Entity}Errors.cs`

```csharp
using SharedKernel;

namespace Domain.Projects;

public static class ProjectErrors
{
    public static Error NotFound(Guid projectId) => Error.NotFound(
        "Projects.NotFound",
        $"The project with the Id = '{projectId}' was not found");
}
```

Kodlar `"{FeaturePlural}.{Reason}"` biçimindedir. Fabrika metodunu anlama göre seç: `Error.NotFound` (404), `Error.Conflict` (409), `Error.Problem` (400), `Error.Failure` (500).

3. **Domain event'leri** — dosya başına bir record, `src/Domain/{Feature}/{Entity}{PastTenseVerb}DomainEvent.cs`

```csharp
using SharedKernel;

namespace Domain.Projects;

public sealed record ProjectCreatedDomainEvent(Guid ProjectId) : IDomainEvent;
```

En az `Created` event'ini oluştur; komutlar ihtiyaç duydukça diğerlerini ekle. Event'ler entity değil, id taşır.

4. **EF konfigürasyonu** — `src/Infrastructure/{Feature}/{Entity}Configuration.cs`

```csharp
using Domain.Projects;
using Domain.Users;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Projects;

internal sealed class ProjectConfiguration : IEntityTypeConfiguration<Project>
{
    public void Configure(EntityTypeBuilder<Project> builder)
    {
        builder.HasKey(p => p.Id);

        builder.HasOne<User>().WithMany().HasForeignKey(p => p.OwnerId);
    }
}
```

İlişkiler shadow-style olarak yapılandırılır (`HasOne<User>().WithMany()`) — entity'ler navigation property değil, foreign-key id'leri tutar. Konfigürasyonlar `ApplyConfigurationsFromAssembly` tarafından otomatik olarak bulunur.

5. **DbContext bağlantısı** — `DbSet<{Entity}> {Plural}`'ı **her ikisine** de ekle:
   - `src/Application/Abstractions/Data/IApplicationDbContext.cs`
   - `src/Infrastructure/Database/ApplicationDbContext.cs`

   `DbSet`'i `tests/Application.UnitTests/Abstractions/TestDbContext.cs`'e de ekle, böylece handler'lar unit test edilebilir kalır.

6. **Migration** — repo kök dizininden:

```
dotnet ef migrations add Add_{Plural} --project src/Infrastructure --startup-project src/Web.Api
```

Migration adları `PascalCase_With_Underscores` biçimindedir (bkz. `Add_RefreshTokens`).

## Kurallar

- Domain projesi yalnızca `SharedKernel`'e referans verir — EF yok, Application tipleri yok. Persistence ile ilgili konular (key'ler, dönüşümler, ilişkiler) yalnızca Infrastructure konfigürasyonunda yaşar.
- İş bittiğinde `dotnet build` ve `dotnet test` çalıştır — `ArchitectureTests` katman kurallarını zorunlu kılar.
- Kullanıcı entity için use case'ler de istiyorsa, `add-feature` skill'i ile devam et.
