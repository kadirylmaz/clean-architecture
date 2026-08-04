---
name: add-feature
description: Eksiksiz bir Clean Architecture feature dilimi (vertical slice) iskeleti oluşturur — command veya query, özel handler, FluentValidation validator, minimal API endpoint'i ve testler (unit, validator, integration). Kullanıcı bu Clean Architecture şablonuna bir feature, use case, command, query veya endpoint eklemek istediğinde kullanılır.
argument-hint: <feature açıklaması, örn. "bir todo öğesini arşivle" veya "bu hafta biten todo'ları getir">
---

# Bir Feature Ekle (Vertical Slice)

Bu şablonun kurallarını takip eden eksiksiz bir use case iskeleti oluştur: özel command/query handler'ı olan bir Application katmanı use case'i, bir Web.Api minimal-API endpoint'i ve testler. MediatR kullanılmaz — bu kod tabanı Scrutor ile kaydedilen handler'lar ve decorator'lar içeren kendi `ICommand`/`IQuery` abstraction'larını kullanır.

## İş Akışı

1. **Use case'i sınıflandır.** Bir durum değişikliği bir **command**'dır; bir okuma bir **query**'dir. İsimleri mevcut desenden türet: use case fiili + entity, örn. `ArchiveTodoCommand`, `GetOverdueTodosQuery`.
2. **Domain katmanını kontrol et.** Entity, `{Entity}Errors` sınıfı veya gerekli bir domain event yoksa, önce onu ekle (bkz. `add-entity` skill'i). Durumu değiştiren command'lar `entity.Raise(...)` ile bir domain event fırlatmalıdır.
3. **Application dilimini oluştur** — `src/Application/{Feature}/{UseCase}/` içinde: command/query, handler, validator (yalnızca command'lar için), response DTO'su (yalnızca query'ler için). Şablonlar: [references/command-slice.md](references/command-slice.md) ve [references/query-slice.md](references/query-slice.md).
4. **Endpoint'i oluştur** — `src/Web.Api/Endpoints/{Feature}/{UseCase}.cs` içinde. Şablon: [references/endpoint.md](references/endpoint.md).
5. **Testleri yaz** — handler unit testleri, validator testleri ve bir integration testi. Şablonlar: [references/tests.md](references/tests.md).
6. **Doğrula:** `dotnet build` ardından `dotnet test`. Üç test projesinin de geçmesi gerekir, `ArchitectureTests` (katman bağımlılık kuralları) dahil.

## Kesinlikle Uyulması Gereken Kurallar

- **Klasör = use case.** `src/Application/{Feature}/` altında her use case için bir klasör (örn. `Todos/Archive/`), bu dilime ait tüm dosyaları içerir.
- **Handler'lar `internal sealed`**'dır, primary constructor kullanır ve `ICommandHandler<TCommand>`, `ICommandHandler<TCommand, TResponse>` veya `IQueryHandler<TQuery, TResponse>`'ı uygular.
- **Manuel DI kaydı yok.** Handler'lar, validator'lar ve endpoint'ler assembly taraması ile bulunur (`Scrutor`, `AddValidatorsFromAssembly`, `AddEndpoints`). Yeni bir dilim için asla `DependencyInjection.cs`'e dokunma.
- **Beklenen hatalar için `Result` / `Result<T>` döndür, asla exception fırlatma.** Hatalar, Domain katmanındaki `{Entity}Errors` üzerinde `"Todos.NotFound"` gibi kodları olan statik fabrika metodlarından gelir.
- **Doğrulama bir `{Command}Validator`'da yaşar** (FluentValidation). Bu, `ValidationDecorator` aracılığıyla otomatik olarak çalışır — handler girdi biçimini kendisi asla doğrulamaz. Query'lerin validator'ı yoktur (decorator yalnızca command'ları sarar).
- **Veri erişimi `IApplicationDbContext` üzerinden yapılır** (`Application.Abstractions.Data`'dan) — Application'dan asla Infrastructure'a referans verilmez.
- **Kullanıcıya ait veriler üzerinde işlem yapan handler'larda yetkilendirme kontrolü**: `IUserContext.UserId`'i karşılaştır ve uyuşmazlıkta `UserErrors.Unauthorized()` döndür, veya query'leri `userContext.UserId`'e göre filtrele.
- **Query'ler `.Select(...)` ile doğrudan bir `{X}Response` DTO'suna projekte edilir** — domain entity'leri asla döndürülmez. Sık okunan verileri `{Feature}CacheKeys` statik sınıfını kullanan `HybridCache` ile cache'le; cache'lenen veriyi değiştiren command'larda invalidate et.
- **Endpoint'ler** `IEndpoint`'i uygular, handler arayüzünü DI'dan doğrudan çözer, `result.Match(Results.Ok, CustomResults.Problem)` kullanır (void command'lar için `Results.NoContent`), `Tags` sınıfıyla etiketlenir ve `.RequireAuthorization()` çağırır.

## İsimlendirme Referansı

| Öğe | Desen | Örnek |
|---|---|---|
| Command | `{Verb}{Entity}Command` | `ArchiveTodoCommand` |
| Query | `Get{X}Query` | `GetOverdueTodosQuery` |
| Handler | `{Command/Query}Handler` | `ArchiveTodoCommandHandler` |
| Validator | `{Command}Validator` | `ArchiveTodoCommandValidator` |
| Response | `{X}Response` | `TodoResponse` |
| Endpoint | `Endpoints/{Feature}/` içinde `{UseCase}.cs` | `Endpoints/Todos/Archive.cs` |
| Unit test | `{Handler}Tests` | `ArchiveTodoCommandHandlerTests` |
| Test metodu | `Handle_Should_{Outcome}_When{Condition}` | `Handle_Should_ReturnNotFound_WhenTodoDoesNotExist` |
