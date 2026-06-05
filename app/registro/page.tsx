"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Building2, Mail, Lock, Loader2, ArrowRight, User, MapPin, ChevronDown } from 'lucide-react';
import Link from 'next/link';

export default function RegistroPage() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ciudad, setCiudad] = useState<'bogota' | 'medellin' | ''>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Mapeo: Bogotá = compania_id 1, Medellín = compania_id 2
  const ciudadConfig = {
    bogota: {
      compania_id: 1,
      label: 'Bogotá',
      subtitle: 'Tech Solutions S.A.S',
      permisos: ['GET ALL', 'GET BY ID', 'POST', 'PUT', 'PATCH'],
      restriccion: 'No puede hacer DELETE',
      color: 'from-amber-500 to-orange-600',
      colorLight: 'amber',
      icon: '🏙️',
    },
    medellin: {
      compania_id: 2,
      label: 'Medellín',
      subtitle: 'Innovatech Ltda',
      permisos: ['GET ALL', 'GET BY ID', 'POST', 'DELETE'],
      restriccion: 'No puede hacer PUT ni PATCH',
      color: 'from-emerald-500 to-teal-600',
      colorLight: 'emerald',
      icon: '🌿',
    },
  };

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (!ciudad) {
      setError('Debes seleccionar una ciudad');
      setIsLoading(false);
      return;
    }

    try {
      const config = ciudadConfig[ciudad];
      await api.post('/auth/registro', {
        nombre: nombre,
        correo: email,
        contrasena: password,
        rol: 'USUARIO',
        compania_id: config.compania_id,
      });

      setSuccess(`✅ Registro exitoso como usuario de ${config.label}. Redirigiendo al login...`);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      if (err.response?.data?.errores) {
        const errorDetails = err.response.data.errores.map((e: any) => `${e.detalle}`).join('. ');
        setError(errorDetails);
      } else {
        setError(err.response?.data?.error || err.response?.data?.mensaje || 'Error al registrar el usuario');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden py-10">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-600/15 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-amber-600/15 blur-[120px]" />
        <div className="absolute top-[50%] left-[50%] w-[30%] h-[30%] rounded-full bg-blue-600/10 blur-[100px] -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="w-full max-w-lg p-6 relative z-10">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/20">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Crear Cuenta</h1>
            <p className="text-slate-400 text-sm text-center">Regístrate y selecciona tu ciudad para definir tus permisos</p>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl mb-6 text-sm flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              {success}
            </div>
          )}

          <form onSubmit={handleRegistro} className="space-y-5">
            {/* Nombre */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">Nombre Completo</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  placeholder="Ej: Juan Pérez"
                  required
                  minLength={3}
                />
              </div>
            </div>

            {/* Correo */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">Correo Electrónico</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  placeholder="correo@ejemplo.com"
                  required
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">Contraseña</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-purple-400 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Selector de Ciudad */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-300 ml-1 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Selecciona tu Ciudad
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Bogotá */}
                <button
                  type="button"
                  onClick={() => setCiudad('bogota')}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-300 text-left group ${
                    ciudad === 'bogota'
                      ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                      : 'border-slate-800 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-900/50'
                  }`}
                >
                  {ciudad === 'bogota' && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <div className="text-2xl mb-2">🏙️</div>
                  <div className={`text-sm font-bold ${ciudad === 'bogota' ? 'text-amber-400' : 'text-slate-300'}`}>
                    Bogotá
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Tech Solutions</div>
                </button>

                {/* Medellín */}
                <button
                  type="button"
                  onClick={() => setCiudad('medellin')}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-300 text-left group ${
                    ciudad === 'medellin'
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                      : 'border-slate-800 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-900/50'
                  }`}
                >
                  {ciudad === 'medellin' && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <div className="text-2xl mb-2">🌿</div>
                  <div className={`text-sm font-bold ${ciudad === 'medellin' ? 'text-emerald-400' : 'text-slate-300'}`}>
                    Medellín
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Innovatech Ltda</div>
                </button>
              </div>

              {/* Info de permisos según ciudad seleccionada */}
              {ciudad && (
                <div className={`rounded-xl p-4 border transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${
                  ciudad === 'bogota'
                    ? 'bg-amber-500/5 border-amber-500/20'
                    : 'bg-emerald-500/5 border-emerald-500/20'
                }`}>
                  <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
                    ciudad === 'bogota' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    Permisos de {ciudadConfig[ciudad].label}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {ciudadConfig[ciudad].permisos.map((p) => (
                      <span
                        key={p}
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                          ciudad === 'bogota'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="w-1 h-1 rounded-full bg-red-400" />
                    <span className="text-[11px] text-red-400">{ciudadConfig[ciudad].restriccion}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !ciudad}
              className={`w-full rounded-xl py-4 font-semibold text-sm transition-all shadow-lg flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed mt-6 text-white ${
                ciudad === 'bogota'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-500/25'
                  : ciudad === 'medellin'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/25'
                  : 'bg-gradient-to-r from-slate-700 to-slate-600 shadow-none'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  Crear Cuenta
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Link to login */}
          <div className="mt-8 text-center border-t border-slate-800/60 pt-6">
            <p className="text-slate-500 text-sm">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Inicia Sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
