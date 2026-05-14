import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { RegisterSchema, type RegisterInput, PLANS_CATALOG } from '@atlas/shared';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { FormField } from '../../components/auth/FormField';
import { useAuth } from '../../stores/auth';
import { ApiError } from '../../lib/api';

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);

  const planCode = params.get('plan');
  const selectedPlan = planCode ? PLANS_CATALOG.find((p) => p.code === planCode) : null;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(RegisterSchema) });

  const onSubmit = handleSubmit(async (data) => {
    setSubmitting(true);
    try {
      await registerUser(data);
      toast.success('Cuenta creada — ¡bienvenido a Atlas!');
      navigate(selectedPlan ? `/app/suscripcion?plan=${selectedPlan.code}` : '/app', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'EMAIL_TAKEN') toast.error('Ya existe una cuenta con ese email.');
        else if (err.code === 'RUT_TAKEN') toast.error('Ya existe una cuenta con ese RUT.');
        else if (err.code === 'VALIDATION_ERROR') toast.error('Revisa los datos del formulario.');
        else toast.error(err.message || 'No pudimos crear tu cuenta.');
      } else {
        toast.error('Error de red. Intenta nuevamente.');
      }
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <AuthLayout
      title="Únete"
      subtitle="Crea tu cuenta y empieza a entrenar hoy. Tu evaluación física inicial es gratis."
      footer={
        <span>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-atlas-yellow hover:underline">
            Inicia sesión
          </Link>
        </span>
      }
    >
      <h2 className="font-display text-3xl uppercase">Crea tu cuenta</h2>
      <p className="mt-2 text-sm text-atlas-black/60">
        {selectedPlan
          ? `Pre-seleccionaste el plan ${selectedPlan.name}.`
          : 'Después podrás elegir tu plan.'}
      </p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        <FormField
          label="Nombre completo"
          type="text"
          autoComplete="name"
          placeholder="Tu nombre y apellido"
          error={errors.fullName?.message}
          {...register('fullName')}
        />
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="tu@email.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <FormField
          label="RUT"
          type="text"
          placeholder="12.345.678-K"
          hint="Opcional, pero necesario al suscribirse a un plan."
          error={errors.rut?.message}
          {...register('rut')}
        />
        <FormField
          label="Teléfono"
          type="tel"
          autoComplete="tel"
          placeholder="+56 9 ..."
          hint="Opcional — útil para recordatorios."
          error={errors.phone?.message}
          {...register('phone')}
        />
        <FormField
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••••"
          hint="Mínimo 10 caracteres, una mayúscula y un número."
          error={errors.password?.message}
          {...register('password')}
        />

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 inline-flex items-center justify-center rounded-full bg-atlas-coral px-6 py-3 font-display uppercase tracking-wider text-atlas-white transition-colors hover:bg-atlas-coral-hover disabled:opacity-50"
        >
          {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>

        <p className="text-center text-xs text-atlas-black/50">
          Al crear cuenta aceptas los términos y condiciones de Atlas Training Center.
        </p>
      </form>
    </AuthLayout>
  );
}
