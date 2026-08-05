import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { authApi } from "@/api/auth";
import { getApiErrorMessage } from "@/api/client";
import { useAuth } from "@/hooks/useAuth";

interface FormErrors {
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  confirmPassword?: string;
}

export function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", firstName: "", lastName: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!form.email.trim()) nextErrors.email = "E-posta gerekli.";
    if (!form.firstName.trim()) nextErrors.firstName = "Ad gerekli.";
    if (!form.lastName.trim()) nextErrors.lastName = "Soyad gerekli.";
    if (form.password.length < 8) nextErrors.password = "Şifre en az 8 karakter olmalı.";
    if (form.confirmPassword !== form.password) nextErrors.confirmPassword = "Şifreler eşleşmiyor.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      await authApi.register({
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        password: form.password,
      });

      const tokens = await authApi.login({ email: form.email, password: form.password });
      await login(tokens.accessToken, tokens.refreshToken);

      toast.success("Hesabın oluşturuldu, hoş geldin!");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Kayıt oluşturulamadı."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Hesap oluştur</h2>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          Görevlerini yönetmeye hemen başla.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Ad"
            placeholder="Ayşe"
            icon={<User className="h-4 w-4" />}
            value={form.firstName}
            onChange={update("firstName")}
            error={errors.firstName}
            autoComplete="given-name"
          />
          <Input
            label="Soyad"
            placeholder="Yılmaz"
            value={form.lastName}
            onChange={update("lastName")}
            error={errors.lastName}
            autoComplete="family-name"
          />
        </div>

        <Input
          label="E-posta"
          type="email"
          placeholder="ornek@sirket.com"
          icon={<Mail className="h-4 w-4" />}
          value={form.email}
          onChange={update("email")}
          error={errors.email}
          autoComplete="email"
        />

        <Input
          label="Şifre"
          type="password"
          placeholder="En az 8 karakter"
          icon={<Lock className="h-4 w-4" />}
          value={form.password}
          onChange={update("password")}
          error={errors.password}
          autoComplete="new-password"
        />

        <Input
          label="Şifre (tekrar)"
          type="password"
          placeholder="••••••••"
          icon={<Lock className="h-4 w-4" />}
          value={form.confirmPassword}
          onChange={update("confirmPassword")}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />

        <Button type="submit" className="w-full justify-center" size="lg" isLoading={isSubmitting}>
          <UserPlus className="h-4 w-4" />
          Kaydol
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Zaten hesabın var mı?{" "}
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
          Giriş yap
        </Link>
      </p>
    </AuthLayout>
  );
}
