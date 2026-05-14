import { Link } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';

export function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Recupera"
      subtitle="Te enviamos un enlace para reestablecer tu contraseña al email registrado."
      footer={
        <Link to="/login" className="font-semibold text-atlas-yellow hover:underline">
          ← Volver al login
        </Link>
      }
    >
      <h2 className="font-display text-3xl uppercase">Recupera tu acceso</h2>
      <p className="mt-3 text-sm text-atlas-black/60">
        El flujo de recuperación de contraseña por email se habilitará en Fase 2. Mientras tanto,
        contáctanos por Instagram o WhatsApp y te ayudamos.
      </p>
    </AuthLayout>
  );
}
