import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { 
  User, 
  Phone, 
  Save, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Contact, 
  List, 
  ArrowLeft,
  Search,
  RefreshCw,
  LogIn,
  LogOut,
  MapPin
} from 'lucide-react';

type View = 'form' | 'list';

interface Registro {
  id: number;
  created_at: string;
  nombre: string;
  telefono: string;
}

function App() {
  const [view, setView] = useState<View>('form');
  
  // Estado del Formulario
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  // Estado de la Lista
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [fichajeLoading, setFichajeLoading] = useState<number | null>(null);

  // URL de la imagen de fondo (Ciudad)
  const cityBackgroundUrl = "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?q=80&w=2070&auto=format&fit=crop";

  // Cargar registros al cambiar a la vista de lista
  useEffect(() => { 
    if (view === 'list') {
      fetchRegistros();
    }
  }, [view]);

  const fetchRegistros = async () => {
    setLoadingList(true);
    setListError(null);
    try {
      const { data, error } = await supabase
        .from('registros')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegistros(data || []);
    } catch (error: any) {
      console.error('Error al obtener registros:', error);
      setListError(error.message || 'Error desconocido al cargar datos');
    } finally {
      setLoadingList(false);
    }
  };

  const handleFichaje = async (usuarioId: number, nombreUsuario: string, tipo: 'INGRESO' | 'SALIDA') => {
    setFichajeLoading(usuarioId);
    try {
      const { error } = await supabase
        .from('fichajes')
        .insert([
          { 
            usuario_id: usuarioId, 
            tipo: tipo,
            fecha_evento: new Date().toISOString()
          }
        ]);

      if (error) throw error;

      alert(`✅ ${tipo === 'INGRESO' ? 'Entrada' : 'Salida'} registrada correctamente para ${nombreUsuario}`);
    } catch (error: any) {
      console.error('Error al fichar:', error);
      alert(`❌ Error al registrar ${tipo.toLowerCase()}: ${error.message}`);
    } finally {
      setFichajeLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      // 1. Guardar el Usuario en la tabla principal 'registros'
      const { error: userError } = await supabase
        .from('registros')
        .insert([{ nombre, telefono }]);

      if (userError) throw userError;

      // 2. Guardar log en la tabla 'logs_registro'
      const { error: logError } = await supabase
        .from('logs_registro')
        .insert([
          { 
            accion: 'Registro de nuevo usuario',
            fecha_registro: new Date().toISOString()
          }
        ]);

      if (logError) console.error("Error guardando log:", logError);

      setStatus({ type: 'success', message: '¡Contacto registrado correctamente!' });
      setNombre('');
      setTelefono('');
    } catch (error: any) {
      console.error('Error al guardar:', error);
      let msg = error.message || 'Ocurrió un error al guardar los datos.';
      if (error.code === '42P01') {
        msg = 'Error: Falta crear las tablas en Supabase. Ejecuta el script SQL actualizado.';
      }
      setStatus({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  // VISTA: LISTA DE REGISTROS
  if (view === 'list') {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat bg-fixed"
        style={{ 
          backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.7)), url("${cityBackgroundUrl}")` 
        }}
      >
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-8 max-w-4xl w-full border border-slate-200 h-[800px] flex flex-col">
          
          {/* Cabecera Lista */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <List className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Control de Asistencia</h1>
                <p className="text-sm text-slate-500">Registra ingresos y salidas de los usuarios</p>
              </div>
            </div>
            <div className="flex gap-2 self-end md:self-auto">
              <button 
                onClick={fetchRegistros}
                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
                title="Recargar lista"
              >
                <RefreshCw className={`w-5 h-5 ${loadingList ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={() => setView('form')}
                className="flex items-center px-3 py-2 text-sm font-medium text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Volver
              </button>
            </div>
          </div>

          {/* Contenido Lista (Scrollable) */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-4">
            {loadingList ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p>Cargando registros...</p>
              </div>
            ) : listError ? (
              <div className="flex flex-col items-center justify-center h-full text-red-400 bg-red-50 rounded-xl p-6 text-center">
                <AlertCircle className="w-10 h-10 mb-2" />
                <p className="font-medium">Error al cargar</p>
                <p className="text-sm opacity-80 mt-1">{listError}</p>
              </div>
            ) : registros.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
                <Search className="w-10 h-10 mb-3 opacity-50" />
                <p className="font-medium text-lg text-slate-600">No se encontraron registros</p>
              </div>
            ) : (
              registros.map((reg) => (
                <div key={reg.id} className="group bg-slate-50 hover:bg-white border border-slate-200 hover:border-indigo-200 p-4 rounded-xl transition-all duration-200 hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors capitalize text-lg">{reg.nombre}</h3>
                    <div className="flex items-center text-sm text-slate-500 mt-1">
                      <Phone className="w-3 h-3 mr-1.5" />
                      {reg.telefono}
                    </div>
                  </div>

                  {/* Botones de Acción de Hora */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleFichaje(reg.id, reg.nombre, 'INGRESO')}
                      disabled={fichajeLoading === reg.id}
                      className="flex items-center px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {fichajeLoading === reg.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4 mr-1.5" />}
                      Entrada
                    </button>
                    <button
                      onClick={() => handleFichaje(reg.id, reg.nombre, 'SALIDA')}
                      disabled={fichajeLoading === reg.id}
                      className="flex items-center px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {fichajeLoading === reg.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4 mr-1.5" />}
                      Salida
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Mapa de Google Maps (Footer) */}
          <div className="flex-shrink-0 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-2 text-slate-600 font-medium text-sm">
               <MapPin className="w-4 h-4 text-indigo-500" />
               Ubicación de la Sede
            </div>
            <div className="w-full h-48 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 relative shadow-inner">
              <iframe 
                width="100%" 
                height="100%" 
                frameBorder="0" 
                scrolling="no" 
                marginHeight={0} 
                marginWidth={0} 
                title="Mapa Sede"
                src="https://maps.google.com/maps?width=100%25&amp;height=600&amp;hl=es&amp;q=Universidad+(Mi%20Organizacion)&amp;t=&amp;z=14&amp;ie=UTF8&amp;iwloc=B&amp;output=embed"
              ></iframe>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // VISTA: FORMULARIO (Default)
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ 
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.7)), url("${cityBackgroundUrl}")` 
      }}
    >
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-8 max-w-md w-full border border-slate-200">
        <div className="text-center mb-8 relative">
           {/* Botón flotante para ir a la lista */}
          <button 
            onClick={() => setView('list')}
            className="absolute top-0 right-0 p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
            title="Ver registros y controlar asistencia"
          >
            <List className="w-6 h-6" />
          </button>

          <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Contact className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Registro de Contacto</h1>
          <p className="text-slate-500 text-sm mt-1">Crea usuarios para gestionar su asistencia</p>
        </div>

        {status.message && (
          <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 border ${status.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {status.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
            <p className="text-sm">{status.message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input
                type="text"
                id="nombre"
                required
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition duration-200"
                placeholder="Ej. María García"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="telefono" className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input
                type="tel"
                id="telefono"
                required
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition duration-200"
                placeholder="Ej. +34 600 000 000"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg shadow-indigo-500/30 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Guardar Registro
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
           <button 
             onClick={() => setView('list')}
             className="text-sm text-indigo-600 hover:text-indigo-800 font-medium hover:underline flex items-center justify-center mx-auto"
           >
             <List className="w-4 h-4 mr-1" />
             Ir a Control de Asistencia
           </button>
        </div>
      </div>
    </div>
  );
}

export default App;