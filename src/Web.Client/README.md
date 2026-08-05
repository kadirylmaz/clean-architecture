# Web.Client

Backend'deki Todo ve kullanıcı özellikleri (`Web.Api`) için React + TypeScript ile yazılmış arayüz.

## Teknolojiler

- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** — tasarım sistemi
- **React Router** — sayfa yönlendirme
- **TanStack Query** — sunucu verisi önbellekleme / senkronizasyon
- **Axios** — HTTP istemcisi, JWT access-token yenileme interceptor'ı ile
- **react-hot-toast** — bildirimler
- **lucide-react** — ikonlar

## Kurulum

```bash
npm install
npm run dev
```

Uygulama varsayılan olarak `http://localhost:5173` üzerinde açılır ve API'ye
`VITE_API_URL` (bkz. `.env.development`, varsayılan `http://localhost:5000`) adresinden istek atar.

> Backend'i `dotnet run` ya da `docker compose up` ile ayağa kaldırdığından emin ol.
> API tarafında bu istemcinin origin'i (`http://localhost:5173`) `appsettings.Development.json`
> içindeki `Cors:AllowedOrigins` altında tanımlıdır.

## Klasör yapısı

```
src/
  api/          Axios istemcisi + endpoint fonksiyonları + DTO tipleri
  components/   UI bileşenleri (ui/, layout/, auth/, todos/)
  context/      AuthContext (giriş durumu, token yönetimi)
  hooks/        useAuth, useTodos (TanStack Query mutation/query'leri)
  lib/          jwt decode, tarih formatlama, token storage yardımcıları
  pages/        LoginPage, RegisterPage, TodosPage, NotFoundPage
  routes/       ProtectedRoute, PublicOnlyRoute
```

## Bilinen kısıtlar

- `PUT /todos/{id}` endpoint'i sadece `description` alanını günceller; bu yüzden
  düzenleme modalında öncelik/son tarih/etiket alanları sadece oluşturma sırasında düzenlenebilir.
  Bunları da güncellenebilir yapmak istersen `UpdateTodoCommand`'ı genişletmek gerekir.
