# Claude Code için Clean Architecture Agent Skill'leri

Claude Code'a Clean Architecture şablonunun kurallarını öğreten bir skill paketi — böylece oluşturduğu her feature senin yazmış gibi görünür: vertical-slice use case'ler, özel command/query handler'ları (MediatR yok), Result tabanlı hata yönetimi, minimal API endpoint'leri ve eksiksiz test kapsamı.

## İçindekiler

| Skill | Çağırma | Ne yapar |
|---|---|---|
| **add-feature** | `/add-feature bir todo öğesini arşivle` | Eksiksiz bir vertical slice iskeleti oluşturur: command/query, handler, validator, endpoint ve unit + validator + integration testleri. |
| **add-entity** | `/add-entity İsmi ve sahibi olan Project` | Bir domain entity'sini baştan sona ekler: entity, hata kataloğu, domain event'leri, EF konfigürasyonu, DbContext bağlantısı, migration. |
| **add-tests** | `/add-tests CopyTodoCommand` | Mevcut use case'ler için handler, validator ve integration testlerini tamamlar. |
| **ca-review** | `/ca-review` | Bekleyen değişiklikleri şablonun kurallarına göre inceler: katman sınırları, hata yönetimi, güvenlik, cache'leme ve test kapsamı. |

Bunları açıkça çağırmak zorunda değilsin — kurulduktan sonra, "bir todo'yu ertelemek için bir endpoint ekle" gibi şeyler söylediğinde Claude Code doğru skill'i otomatik olarak seçer.

## Kurulum

Skill'ler `.claude/skills/` içinde yaşar. Şablonu klonladıysan, zaten aktifler — sadece repo'yu Claude Code'da aç.

Bu şablona dayanan başka bir projede kullanmak için klasörü kopyala:

```
your-project/
└── .claude/
    └── skills/
        ├── add-feature/
        ├── add-entity/
        ├── add-tests/
        └── ca-review/
```

Şablonun hem standart hem de Aspire varyantlarıyla çalışır.

## Dene

```
/add-feature bir todo'yu belirli bir tarihe kadar ertele
```

Claude command'ı, validator'ı, handler'ı (sahiplik kontrolü, domain event ve cache invalidation ile), endpoint'i ve üç test türünü oluşturacak — ardından build alıp testleri çalıştıracak.

## Özelleştirme

Her skill düz bir Markdown dosyasıdır (`SKILL.md`, artı `references/` altında şablonlar). Katmanlarını yeniden adlandırdın, her yerde record tercih ediyorsun, farklı bir test yığını kullanıyorsun? Şablonları bir kez düzenle, gelecekteki her feature bunu takip etsin. Skill'ler, takımının kurallar dokümanının çalıştırılabilir versiyonudur.

---

Milan Jovanović'in [Clean Architecture şablonu](https://www.milanjovanovic.tech) için oluşturuldu.
