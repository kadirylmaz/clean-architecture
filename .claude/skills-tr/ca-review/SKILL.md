---
name: ca-review
description: Bekleyen değişiklikleri Clean Architecture şablonunun kurallarına göre inceler — katman sınırları, Result tabanlı hata yönetimi, dilim yapısı, doğrulama, endpoint'ler ve test kapsamı. Kullanıcı değişiklikleri incelemek, kuralları kontrol etmek veya commit öncesi bir feature'ı denetlemek istediğinde kullanılır.
argument-hint: [isteğe bağlı: incelenecek belirli dosyalar veya feature; varsayılan olarak working-tree diff'i kullanılır]
---

# Clean Architecture Kural İncelemesi

Verilen kapsamı (varsayılan: `git diff` + izlenmeyen dosyalar) bu şablonun kurallarına göre incele. Bulguları önem sırasına göre, file:line referanslarıyla raporla. İstenmedikçe hiçbir şeyi düzeltme.

## Kontrol Listesi

### Katman sınırları (ihlaller engelleyicidir)
- Domain yalnızca `SharedKernel`'e referans verir — EF Core yok, Application/Infrastructure/Web.Api tipleri yok.
- Application yalnızca Domain + SharedKernel'e referans verir; veri erişimi yalnızca `IApplicationDbContext` üzerinden yapılır; Application içinde hiçbir yerde `using Infrastructure.*` yoktur.
- Persistence detayları (key'ler, dönüşümler, ilişkiler) entity'lerde değil, Infrastructure `IEntityTypeConfiguration<>` sınıflarında yaşar.
- Web.Api endpoint'leri iş mantığı içermez — yalnızca request→command eşlemesi ve result eşleştirmesi.

### Dilim yapısı
- `src/Application/{Feature}/{UseCase}/` altında use case başına bir klasör; endpoint bunu `src/Web.Api/Endpoints/{Feature}/{UseCase}.cs`'de yansıtır.
- İsimlendirme: `{Verb}{Entity}Command` / `Get{X}Query` / `...Handler` / `...Validator` / `{X}Response`.
- Handler'lar primary constructor'lı `internal sealed`'dır, özel `ICommandHandler<>`/`IQueryHandler<>`'ı uygular — MediatR yok, handler'lar/validator'lar/endpoint'ler için manuel DI kaydı yok.
- Response DTO'ları dilim başınadır; query'ler `.Select(...)` ile projekte edilir ve domain entity'lerini asla döndürmez.

### Hata yönetimi
- Beklenen başarısızlıklar `Result`/`Result<T>` döndürür — kontrol akışı için exception yok, iş kuralları etrafında try/catch yok.
- Hatalar, `"{Feature}.{Reason}"` kodlarına ve anlamsal olarak doğru tipe (`NotFound`/`Conflict`/`Problem`/`Failure`) sahip statik `{Entity}Errors` fabrikalarından gelir.
- Endpoint'ler başarısızlıkları yalnızca `result.Match(Results.Ok|NoContent, CustomResults.Problem)` ile çevirir.

### Doğrulama ve güvenlik
- Her command'ın bir FluentValidation `{Command}Validator`'ı vardır; handler'lar girdi biçimini yeniden kontrol etmez (ancak iş kurallarını uygular).
- Kullanıcıya ait veriler üzerinde işlem yapan handler'lar sahipliği zorunlu kılar: `IUserContext.UserId`'e göre filtreler veya `UserErrors.Unauthorized()` döndürür.
- Yeni endpoint'ler `.RequireAuthorization()` (veya `.HasPermission(...)`) ve `.WithTags(Tags.X)` çağırır.
- Application içinde `DateTime.UtcNow`/`DateTime.Now` yoktur — `IDateTimeProvider` kullanılır.

### Durum değişiklikleri ve cache'leme
- Durumu değiştiren command'lar, `SaveChangesAsync`'den önce `entity.Raise(new XDomainEvent(id))` ile bir domain event fırlatır.
- `HybridCache` ile cache'lenen her okumanın, o veriyi değiştiren her command'da eşleşen bir invalidation'ı (`cache.RemoveAsync`) vardır; key'ler `{Feature}CacheKeys` sınıfından gelir.

### Testler
- Yeni/değişen handler'ların, her `Result.Failure` yolunu ve happy path'i (kalıcı durum + domain event'ler) kapsayan unit testleri vardır.
- Yeni/değişen validator'ların kural başına `TestValidate` testleri vardır.
- Yeni/değişen endpoint'lerin gerçek HTTP üzerinden integration testleri vardır.
- Test isimlendirmesi ve Arrange/Act/Assert yapısı mevcut testlerle eşleşir.

## Çıktı Biçimi

Bulguları **Engelleyiciler** (katman ihlalleri, eksik auth, beklenen başarısızlıklar için fırlatılan exception'lar), **Kural ihlalleri** (isimlendirme, yapı, hata kodları, eksik event'ler/invalidation) ve **Test boşlukları** olarak grupla. Her biri için: `file:line`, ne yanlış ve tek satırlık düzeltme. Bir sonuçla kapat: commit'e hazır, veya önce ne değişmeli. Her şey geçerse, bunu söyle ve doğrulamak için `dotnet build` + `dotnet test` çalıştır.
