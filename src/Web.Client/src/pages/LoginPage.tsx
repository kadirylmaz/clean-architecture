import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn } from "lucide-react";
import toast from "react-hot-toast";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { authApi } from "@/api/auth";
import { getApiErrorMessage } from "@/api/client";
import { useAuth } from "@/hooks/useAuth";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const tokens = await authApi.login({ email, password });
      await login(tokens.accessToken, tokens.refreshToken);
      toast.success("Tekrar hoş geldin!");
      navigate(from, { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, "E-posta veya şifre hatalı."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Tekrar hoş geldin</h2>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          Devam etmek için hesabına giriş yap.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="E-posta"
          type="email"
          placeholder="ornek@sirket.com"
          icon={<Mail className="h-4 w-4" />}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
        <Input
          label="Şifre"
          type="password"
          placeholder="••••••••"
          icon={<Lock className="h-4 w-4" />}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          error={error ?? undefined}
          required
        />

        <Button type="submit" className="w-full justify-center" size="lg" isLoading={isSubmitting}>
          <LogIn className="h-4 w-4" />
          Giriş yap
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Hesabın yok mu?{" "}
        <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
          Hemen kaydol
        </Link>
      </p>
    </AuthLayout>
  );
}
