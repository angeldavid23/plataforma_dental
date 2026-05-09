import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import type { Paciente, Tratamiento } from './types/supabase';
import { Banknote, Plus, Search, ClipboardList, X } from 'lucide-react';
import { NuevoPaciente } from './components/NuevoPaciente.tsx';
import { ModalAbono } from './components/ModalAbono';

type PacienteConTratamiento = Paciente & {
  tratamientos: Tratamiento[];
  odontograma: any[]; // Añadimos la relación de dientes
};

function App() {
  const [datos, setDatos] = useState<PacienteConTratamiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarNuevoPaciente, setMostrarNuevoPaciente] = useState(false);
  const [pacienteAEditar, setPacienteAEditar] = useState<PacienteConTratamiento | null>(null);
  const [abonoSeleccionado, setAbonoSeleccionado] = useState<{
    id: string;
    paciente: string;
    saldo: number;
  } | null>(null);

  const fetchPacientes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pacientes')
      .select(`
        *,
        tratamientos (*),
        odontograma (*)
      `)
      .order('creado_en', { ascending: false });

    if (error) console.error("Error al traer datos:", error);
    else setDatos(data as any);
    setLoading(false);
  };

  useEffect(() => {
    fetchPacientes();
  }, []);

  const datosFiltrados = datos.filter((p) => {
    const termino = busqueda.toLowerCase();
    return (
      p.nombre_completo.toLowerCase().includes(termino) ||
      p.telefono.includes(termino)
    );
  });

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Clínica Dental</h1>
          <p className="text-slate-500 font-medium">Control de tratamientos y abonos</p>
        </div>
        <button 
          onClick={() => setMostrarNuevoPaciente(!mostrarNuevoPaciente)}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          {mostrarNuevoPaciente ? 'Cerrar Formulario' : <><Plus size={20} /> Nuevo Paciente</>}
        </button>
      </header>

      {/* Buscador */}
      <div className="mb-8 relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
          <Search size={20} />
        </div>
        <input
          type="text"
          placeholder="Buscar paciente por nombre o teléfono..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-slate-700 font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all shadow-sm"
        />
      </div>

      {mostrarNuevoPaciente && (
        <div className="mb-10">
          <NuevoPaciente onCreated={() => {
            fetchPacientes();
            setMostrarNuevoPaciente(false);
          }} />
        </div>
      )}

      {/* Listado de Pacientes */}
      {loading ? (
        <p className="text-center text-slate-400 animate-pulse py-20">Cargando expedientes...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {datosFiltrados.map((paciente) => (
            <div key={paciente.id} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl transition-shadow relative overflow-hidden">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold uppercase">
                    {paciente.nombre_completo.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg leading-none">{paciente.nombre_completo}</h3>
                    <p className="text-slate-400 text-sm mt-1">{paciente.telefono}</p>
                  </div>
                </div>
                {/* BOTÓN PARA VER EXPEDIENTE / DIENTES */}
                <button 
                  onClick={() => setPacienteAEditar(paciente)}
                  className="p-2 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                >
                  <ClipboardList size={20} />
                </button>
              </div>

              {paciente.tratamientos.map((t) => (
                <div key={t.id} className="bg-slate-50 rounded-xl p-4 mb-3 border border-slate-100">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-bold text-slate-600">{t.nombre_servicio}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${t.saldo_pendiente <= 0 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {t.saldo_pendiente <= 0 ? 'Pagado' : 'Pendiente'}
                    </span>
                  </div>
                  <div className="mt-4 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Saldo</p>
                      <p className="text-2xl font-black text-slate-900">Q{t.saldo_pendiente}</p>
                    </div>
                    <button 
                      onClick={() => setAbonoSeleccionado({ id: t.id, paciente: paciente.nombre_completo, saldo: t.saldo_pendiente })}
                      className="bg-white border border-slate-200 p-2 rounded-lg text-slate-600 hover:bg-blue-600 hover:text-white transition-colors"
                    >
                      <Banknote size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE EDICIÓN / EXPEDIENTE COMPLETO */}
      {pacienteAEditar && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[200] overflow-y-auto p-4 md:p-10 flex justify-center">
          <div className="w-full max-w-7xl relative">
            <button 
              onClick={() => setPacienteAEditar(null)}
              className="absolute -top-12 right-0 md:right-4 text-white font-black flex items-center gap-2 hover:bg-white/10 p-2 rounded-lg transition-all"
            >
              <X size={24} /> CERRAR EXPEDIENTE
            </button>
            <NuevoPaciente 
              datosIniciales={pacienteAEditar} 
              onCreated={() => {
                fetchPacientes();
                setPacienteAEditar(null);
              }} 
            />
          </div>
        </div>
      )}

      {abonoSeleccionado && (
        <ModalAbono 
          tratamientoId={abonoSeleccionado.id}
          nombrePaciente={abonoSeleccionado.paciente}
          saldoActual={abonoSeleccionado.saldo}
          onClose={() => setAbonoSeleccionado(null)}
          onSuccess={() => { fetchPacientes(); setAbonoSeleccionado(null); }}
        />
      )}
    </div>
  );
}

export default App;