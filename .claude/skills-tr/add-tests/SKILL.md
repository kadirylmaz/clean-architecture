---
name: add-tests
description: Clean Architecture şablonundaki mevcut use case'ler için eksik testleri tamamlar — handler unit testleri, FluentValidation validator testleri ve HTTP integration testleri. Kullanıcı test kapsamını eklemek, iyileştirmek veya tamamlamak istediğinde kullanılır.
argument-hint: <kapsanacak use case veya feature, örn. "CopyTodoCommand" veya "Users feature'ı">
---

# Mevcut Bir Use Case İçin Test Ekle

Bu şablonun her dilim için beklediği üç test türünü tamamla. Önce hedef handler/validator/endpoint'i oku, ardından en yakın mevcut test sınıfının yapısını yansıt.

## İş Akışı

1. **Dilimi bul.** Hedef use case için command/query, handler, validator ve endpoint'i bul. Her farklı sonucu listele: her guard clause (`return Result.Failure(...)`) ve happy path.
2. **Zaten var olanı kontrol et** — `tests/Application.UnitTests/{Feature}/` ve `tests/IntegrationTests/{Feature}/` içinde; mevcut sınıfları genişlet, tekrarlama.
3. **Handler unit testlerini yaz** — başarısızlık yolu başına bir test, artı kalıcı durumu ve fırlatılan domain event'lerini assert eden bir happy path.
4. **Validator testlerini yaz** (yalnızca command'lar) — kural başına bir başarısız test, artı tamamen geçerli bir command.
5. **Integration testlerini yaz** — gerçek HTTP üzerinden happy path, sonraki bir GET ile assert edilen durum; handler'ın başarısızlık yolları varsa hata çevirisi (404/409/400); route ailesi yeniyse token olmadan 401.
6. **Çalıştır** `dotnet test` (integration testleri için Docker çalışıyor olmalı) ve bitirmeden önce başarısızlıkları düzelt.

## Kurallar

- **Framework'ler:** xUnit + Shouldly + NSubstitute; validator'lar için `FluentValidation.TestHelper`. Global using'ler zaten `Xunit`, `NSubstitute`, `Shouldly`, `SharedKernel`'i kapsar.
- **Unit test tabanı:** `BaseHandlerTest`'ten kalıtım al; taze bir in-memory `TestDbContext` için `CreateDbContext()` ve gerçek bir `HybridCache` için `CreateCache()` kullan. Yalnızca arayüzleri (`IUserContext`, `IDateTimeProvider`, `IPasswordHasher`, `ITokenProvider`) substitute et — DbContext'i asla mock'lama.
- **Integration test tabanı:** `IntegrationTestWebAppFactory` collection fixture'ı ile `BaseIntegrationTest(factory)`'den kalıtım al; kimlik doğrulamalı çağrılar için `RegisterAndLoginAsync()` + `Authenticate(token)` kullan. Özel response DTO record'larını test sınıfının içinde tanımla (bkz. `TodosTests.TodoDto`).
- **İsimlendirme:** sınıflar `{Handler}Tests` / `{Feature}ValidatorsTests` / `{Feature}Tests`; metodlar `Handle_Should_{Outcome}_When{Condition}` (unit) veya `{Action}_Should_{Outcome}[_When{Condition}]` (integration).
- **Yapı:** her testte `// Arrange` / `// Act` / `// Assert` yorumları.
- **Assertion'lar:** tam domain hatalarını karşılaştır (`result.Error.ShouldBe(TodoItemErrors.NotFound(id))`); kalıcı durumu context'ten yeniden okuyarak (unit) veya bir GET isteğiyle (integration) assert et; domain event'lerini `entity.DomainEvents.ShouldContain(e => e is XDomainEvent)` ile assert et.

Tam açıklamalı şablonlar: [../add-feature/references/tests.md](../add-feature/references/tests.md) (`add-feature` skill'i kuruluysa) veya bu repo'daki `CreateTodoCommandHandlerTests`, `TodoValidatorsTests` ve `TodosTests`'i yansıt.
