import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft } from 'lucide-react';
import { apiFetch } from '../../lib/api';

export function QrCheckinPage() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const { data, refetch, isFetching } = useQuery({
    queryKey: ['me', 'qr-token'],
    queryFn: () => apiFetch<{ token: string; expiresAt: string }>('/me/qr-token'),
    refetchInterval: 25_000,
  });

  const secondsLeft = data ? Math.max(0, Math.ceil((new Date(data.expiresAt).getTime() - now) / 1000)) : 0;

  return (
    <main className="flex min-h-dvh flex-col bg-atlas-black text-atlas-white">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-6">
        <Link to="/app" className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-atlas-white/60 hover:text-atlas-white">
          <ArrowLeft size={14} />
          Volver al dashboard
        </Link>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
        <p className="font-sans text-xs uppercase tracking-[0.4em] text-atlas-yellow">
          Muestra este código en recepción
        </p>
        <h1 className="mt-3 font-display text-5xl uppercase leading-[0.95]">
          Marca tu entrada
        </h1>

        <div className="mt-10 rounded-3xl bg-white p-8 shadow-2xl">
          {data ? (
            <QRCodeSVG
              value={data.token}
              size={256}
              level="M"
              marginSize={0}
              fgColor="#0A0A0A"
              bgColor="#FFFFFF"
            />
          ) : (
            <div className="h-64 w-64 animate-pulse rounded-lg bg-atlas-white/10" />
          )}
        </div>

        <p className="mt-6 font-mono text-xs uppercase tracking-widest text-atlas-white/40">
          {isFetching ? 'Generando…' : `Se renueva en ${secondsLeft}s`}
        </p>

        <button
          type="button"
          onClick={() => refetch()}
          className="mt-2 text-xs text-atlas-yellow hover:underline"
        >
          Renovar ahora
        </button>

        <div className="mt-12 max-w-md text-sm text-atlas-white/50">
          El código cambia cada minuto. Si recepción no logra escanearlo, pídele que use búsqueda
          manual con tu RUT o email.
        </div>
      </section>
    </main>
  );
}
