import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { LoginSchema, type LoginInput } from '@atlas/shared';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { FormField } from '../../components/auth/FormField';
import { useAuth } from '../../stores/auth';
import { ApiError } from '../../lib/api';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(LoginSchema) });

  const onSubmit = handleSubmit(async (data) => {
    setSubmitting(true);
    try {
      await login(data);
      const next = (location.state as { from?: string } | null)?.from ?? '/app';
      navigate(next, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'INVALID_CREDENTIALS') {
          toast.error('Email o contraseña incorrectos');
        } else if (err.code === 'USER_INACTIVE') {
          toast.error('Tu cuenta está inactiva. Contáctanos.');
        } else if (err.code === 'TOO_MANY_REQUESTS') {
          toast.error('Demasiados intentos. Espera un minuto.');
        } else {
          toast.error(err.message || 'No pudimos iniciar sesión.');
        }
      } else {
        toast.error('Error de red. Intenta nuevamente.');
      }
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <AuthLayout
      title="Bienvenido"
      subtitle="Marca tu entrada, sigue tu racha y agenda con tu equipo. Todo desde un solo lugar."
      footer={
        <span>
          ¿Aún no tienes cuenta?{' '}
          <Link to="/registro" className="font-semibold text-atlas-yellow hover:underline">
            Regístrate
          </Link>
        </span>
      }
    >
      <h2 className="font-display text-3xl uppercase">Inicia sesión</h2>
      <p className="mt-2 text-sm text-atlas-black/60">Accede a tu dashboard Atlas.</p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-5" noValidate>
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="tu@email.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <FormField
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        <Link
          to="/recuperar"
          className="self-end text-xs font-semibold uppercase tracking-wider text-atlas-coral hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </Link>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 inline-flex items-center justify-center rounded-full bg-atlas-coral px-6 py-3 font-display uppercase tracking-wider text-atlas-white transition-colors hover:bg-atlas-coral-hover disabled:opacity-50"
        >
          {submitting ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </AuthLayout>
  );
}
