---
name: new-feature
description: En güncel develop'tan koparılan, feature-1, feature-2, feature-3, ... şeklinde otomatik numaralandırılan yeni bir feature branch'i oluşturur. Kullanıcı yeni bir feature başlatmak, bir feature branch'i oluşturmak veya bir feature üzerinde çalışmaya başlamak istediğinde kullanılır.
argument-hint: [isteğe bağlı: feature'ın kısa açıklaması — sadece bağlam/commit mesajları için kullanılır, branch'in adı her zaman feature-N olur]
---

# Yeni Bir Feature Branch'i Oluştur

## Branch modeli

- **`main`** — stabil/release branch'i. Geleneksel bir `master` gibi davranılır: asla doğrudan bundan feature koparılmaz, yalnızca release zamanında `develop`'tan merge alır.
- **`develop`** — entegrasyon branch'i. Repo'nun varsayılan branch'idir ve tüm feature çalışmalarının temelidir.
- **`feature-{N}`** — her feature için bir branch, her zaman en güncel `develop`'tan koparılır, her zaman ardışık bir tam sayı ile adlandırılır (`feature-1`, `feature-2`, `feature-3`, ...) — `feature-login` veya `feature/add-todo` gibi açıklayıcı bir isim asla kullanılmaz.

## İş Akışı

1. **Çalışma dizininin temiz olduğunu kontrol et.** `git status --short` çalıştır. Kaydedilmemiş değişiklikler varsa dur ve kullanıcıya branch değiştirmeden önce commit mi, stash mi, yoksa vazgeçmek mi istediğini sor — kaydedilmemiş bir işi asla sessizce başka bir branch'e taşıma.
2. **`develop`'u senkronize et.**
   ```
   git fetch origin
   git checkout develop
   git pull origin develop
   ```
3. **Bir sonraki feature numarasını belirle.** Hem local hem remote branch'lere bak:
   ```
   git branch -a | grep -oE 'feature-[0-9]+' | grep -oE '[0-9]+' | sort -n | tail -1
   ```
   Sonraki numara = bulunan en yüksek numara + 1. Hiçbiri yoksa `feature-1`'den başla.

   Not: bir feature branch'i merge edildiğinde genellikle silinir, bu yüzden bu tarama yalnızca hâlâ var olan branch'leri görür. Kullanıcı silindikten sonra da bir numaranın asla tekrar kullanılmamasını önemsiyorsa, merge edilmiş PR geçmişini de kontrol et (GitHub API `GET /repos/{owner}/{repo}/pulls?state=all`, `feature-\d+` ile eşleşen `head.ref` değerlerini çıkar) ve iki kaynaktaki en yüksek değeri al.
4. **Branch'i `develop`'tan oluştur:**
   ```
   git checkout -b feature-{N}
   ```
5. **Yayınla:**
   ```
   git push -u origin feature-{N}
   ```
6. **Bildir** — branch adını (ve kullanıcı bir açıklama verdiyse ne için olduğunu) kullanıcıya raporla.

## Kurallar

- Feature branch'leri her zaman `develop`'tan koparılır, asla `main`'den değil.
- Branch adları kesinlikle `feature-{N}` biçimindedir — branch adının içinde ek/açıklayıcı metin olmaz. Açıklamayı ilk commit mesajına veya PR başlığına koy.
- Bir feature tamamlandığında `develop`'a merge edilir, `main`'e değil.
- 1. adımdaki temiz çalışma dizini kontrolünü asla atlama — kaydedilmemiş değişikliklerle branch değiştirmek onları yanlış branch'e taşıyabilir veya checkout'u engelleyebilir.
