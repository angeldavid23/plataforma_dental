import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  PlusCircle,
  ClipboardList,
  Save,
  RotateCcw,
  FileText,
  Briefcase,
  Heart,
  Maximize2,
  X,
  CheckCircle2
} from 'lucide-react';
// IMPORTACIÓN DEL CANVAS INTERACTIVO Y SUS HERRAMIENTAS
import { OdontogramaCanvas } from './odontogram/OdontogramCanvas';
import { OdontogramaToolbar } from './odontogram/OdontogramToolbar';
import type { Stroke } from '../types/odontogram';

interface NuevoPacienteProps {
  onCreated: () => void;
  datosIniciales?: any;
}

const SECCIONES = {
  SUP_DER: {
    letras: ['A', 'B', 'C', 'D', 'E'],
    numeros: ['1', '2', '3', '4', '5', '6', '7', '8']
  },
  SUP_IZQ: {
    numeros: ['9', '10', '11', '12', '13', '14', '15', '16'],
    letras: ['F', 'G', 'H', 'I', 'J']
  },
  INF_DER_BAJO: {
    letras_v2: ['E', 'D', 'C', 'B', 'A'],
    numeros_v2: ['8', '7', '6', '5', '4', '3', '2', '1']
  },
  INF_IZQ_BAJO: {
    numeros_v2: ['1', '2', '3', '4', '5', '6', '7', '8'],
    letras_v2: ['A', 'B', 'C', 'D']
  }
};

const ESTADOS = [
  { label: 'Sano', color: 'bg-emerald-500', fill: 'fill-emerald-500/20 hover:fill-emerald-500/40', id: 'sano', completado: false },
  { label: 'Trabajado', color: 'bg-blue-500', fill: 'fill-blue-500 hover:fill-blue-400', id: 'trabajado', completado: true },
  { label: 'Ausente / Extracción', color: 'bg-slate-700', fill: 'fill-slate-700/40 hover:fill-slate-600/50 opacity-40', id: 'ausente', completado: false }
];

// Definición estricta del objeto de cada diente incluyendo sus vectores
interface DienteEstado {
  condicion: string;
  completado: boolean;
  notas: string;
  strokes: Stroke[];
}

export const NuevoPaciente = ({
  onCreated,
  datosIniciales
}: NuevoPacienteProps) => {

  const isEditing = !!datosIniciales?.id;

  const [nombre, setNombre] = useState('');
  const [tel, setTel] = useState('');
  const [servicio, setServicio] = useState('');
  const [costo, setCosto] = useState('');

  const [infoGeneral, setInfoGeneral] = useState({
    direccion: '', tel_casa: '', tel_oficina: '', ciudad: '', fecha_examen: '',
    fecha_nacimiento: '', estado_civil: '', ocupacion: '', ocupacion_direccion: '',
    ocupacion_tel: '', recomendado_por: '', referido_por: '', persona_responsable: '',
    responsable_direccion: '', responsable_tel: '', medico_personal: '', medico_tel: '',
    odontologo_anterior: '', odontologo_tel: '', direccion_cobrar: '', estimado: ''
  });

  const [historiaDental, setHistoriaDental] = useState({
    primera_visita: false, satisfactoria: false, anestesia_local: false, radiografias: false,
    higiene_oral: false, visitas_periodicas: false, hubo_problema: false,
    sensibilidad: { calor: false, dulces: false, masticacion: false, frio: false, lesiones_previas: false },
    history_de: { chuparse_dedo: false, protrusion_lingual: false, onicofagia: false, dificultad_tragar: false, respiracion_bucal: false, mordedor_objetos: false }
  });

  const [historiaMedica, setHistoriaMedica] = useState({
    examen_fisico: false, cardiacos: false, presion_alta: false, presion_baja: false, circulatorios: false,
    nerviosos: false, radiacion: false, region_auditiva: false, sangramiento_excesivo: false, encias_sangrantes: false,
    empaque_alimenticio: false, fluor: false, vitalidad_pulpar: false, alergia_anestesicos: false, alergia_antibioticos: false,
    otras_alergias: false, amigdalectomia: false, adenoides: false, anemia: false, artritis: false,
    asma: false, encefalitis: false, viruela: false, sinusitis: false, epilepsia: false,
    tumores: false, mastoiditis: false, otitis: false, paperas: false, nefrosis: false,
    fiebre_reumatica: false, escarlatina: false, tifoidea: false, amigdalitis: false, tuberculosis: false,
    sifilis: false, observaciones: ''
  });

  // ESTADO MAESTRO OPTIMIZADO PARA PERSISTIR CONDICIÓN, NOTAS Y DIBUJOS VECTORIALES
  const [odontograma, setOdontograma] = useState<Record<string, DienteEstado>>({});
  const [isOdontogramaOpen, setIsOdontogramaOpen] = useState(false);
  const [dienteActivo, setDienteActivo] = useState<string | null>(null);

  // ESTADOS REACTIVOS TEMPORALES PARA EL LIENZO ACTUAL EN EDICIÓN
  const [strokesTemporales, setStrokesTemporales] = useState<Stroke[]>([]);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [strokeColor, setStrokeColor] = useState<string>('#EF4444');
  const [strokeWidth, setStrokeWidth] = useState<number>(4);

  // Sincronizar los trazos del lienzo cuando el odontólogo cambie de pieza dental
  useEffect(() => {
    if (dienteActivo) {
      const datosDienteExistente = odontograma[dienteActivo];
      setStrokesTemporales(datosDienteExistente?.strokes || []);
    } else {
      setStrokesTemporales([]);
    }
  }, [dienteActivo, odontograma]);

  // Carga inicial en modo edición
  useEffect(() => {
    if (isEditing && datosIniciales) {
      setNombre(datosIniciales.nombre_completo || '');
      setTel(datosIniciales.telefono || '');
      if (datosIniciales.tratamientos?.[0]) {
        setServicio(datosIniciales.tratamientos[0].nombre_servicio || '');
        setCosto(datosIniciales.tratamientos[0].costo_total?.toString() || '');
      }
      if (datosIniciales.antecedentes) {
        const ant = datosIniciales.antecedentes;
        if (ant.infoGeneral) setInfoGeneral(ant.infoGeneral);
        if (ant.historiaDental) setHistoriaDental(ant.historiaDental);
        if (ant.historiaMedica) setHistoriaMedica(ant.historiaMedica);
      }
      
      if (datosIniciales.odontograma) {
        const mapa: Record<string, DienteEstado> = {};
        datosIniciales.odontograma.forEach((d: any) => {
          try {
            const infoObjeto = JSON.parse(d.estado);
            mapa[d.numero_diente] = {
              condicion: infoObjeto.condicion || 'sano',
              completado: !!infoObjeto.completado,
              notas: d.notas || '',
              strokes: Array.isArray(infoObjeto.strokes) ? infoObjeto.strokes : []
            };
          } catch (e) {
            mapa[d.numero_diente] = {
              condicion: d.estado || 'sano',
              completado: false,
              notas: d.notas || '',
              strokes: []
            };
          }
        });
        setOdontograma(mapa);
      }
    }
  }, [datosIniciales, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let pacienteId = datosIniciales?.id;
      const costoNumerico = parseFloat(costo) || 0;
      const antecedentes = { infoGeneral, historiaDental, historiaMedica };

      if (isEditing) {
        const { error: errorPac } = await supabase
          .from('pacientes')
          .update({ telefono: tel, antecedentes })
          .eq('id', pacienteId);
        if (errorPac) throw errorPac;

        const tratamientoAnterior = datosIniciales.tratamientos?.[0];
        let nuevoSaldo = costoNumerico;

        if (tratamientoAnterior) {
          const costoAnterior = tratamientoAnterior.costo_total || 0;
          const saldoAnterior = tratamientoAnterior.saldo_pendiente || 0;
          const diferencia = costoNumerico - costoAnterior;
          nuevoSaldo = Math.max(0, saldoAnterior + diferencia);
        }

        const { error: errorTrat } = await supabase
          .from('tratamientos')
          .update({
            nombre_servicio: servicio,
            costo_total: costoNumerico,
            saldo_pendiente: nuevoSaldo 
          })
          .eq('paciente_id', pacienteId);
        if (errorTrat) throw errorTrat;

        const { error: errorDelOdonto } = await supabase
          .from('odontograma')
          .delete()
          .eq('paciente_id', pacienteId);
        if (errorDelOdonto) throw errorDelOdonto;
      } else {
        const { data: paciente, error } = await supabase
          .from('pacientes')
          .insert([{ nombre_completo: nombre, telefono: tel, antecedentes }])
          .select().single();

        if (error) throw error;
        pacienteId = paciente.id;

        await supabase.from('tratamientos').insert([{
          paciente_id: pacienteId,
          nombre_servicio: servicio || 'Tratamiento Inicial',
          costo_total: costoNumerico,
          saldo_pendiente: costoNumerico
        }]);
      }

      // GUARDADO REAL CON EL ARREGLO DE TRAZOS SERIALIZADO EN EL CAMPO 'ESTADO'
      const registros = Object.entries(odontograma).map(([numero_diente, info]) => ({
        paciente_id: pacienteId,
        numero_diente,
        estado: JSON.stringify({ 
          condicion: info.condicion, 
          completado: info.completado,
          strokes: info.strokes // Guardamos tus dibujos aquí
        }), 
        notas: info.notas || ''
      }));

      if (registros.length > 0) {
        const { error: errorIns } = await supabase.from('odontograma').insert(registros);
        if (errorIns) throw errorIns;
      }

      alert(isEditing ? 'Expediente actualizado exitosamente' : 'Expediente creado exitosamente');
      onCreated();
    } catch (err: any) {
      console.error(err);
      alert('Error: ' + err.message);
    }
  };

  const DienteComponent = ({ label, seccion }: { label: string; seccion: string; }) => {
    const id = `${label}_${seccion}`.toLowerCase();
    const infoDiente = odontograma[id];

    let fillClase = 'fill-emerald-500/20 hover:fill-emerald-500/40'; 

    if (infoDiente) {
      const coincidencia = ESTADOS.find(e => e.id === infoDiente.condicion && e.completado === infoDiente.completado);
      fillClase = coincidencia ? coincidencia.fill : 'fill-emerald-500/20 hover:fill-emerald-500/40';
    }

    const esSeleccionado = dienteActivo === id;

    return (
      <div className="flex flex-col items-center min-w-[45px]">
        <div className="bg-slate-950 border border-slate-800 text-slate-400 w-full text-[10px] font-black py-0.5 rounded-t-lg flex justify-center shadow-inner">
          {label}
        </div>
        <button
          type="button"
          onClick={() => setDienteActivo(esSeleccionado ? null : id)}
          className={`w-full p-1 bg-slate-950/40 border-2 border-t-0 rounded-b-lg transition-all flex flex-col items-center justify-center ${
            esSeleccionado ? 'border-cyan-400 scale-110 ring-4 ring-cyan-500/20 z-10' : 'border-slate-800/80 hover:bg-slate-900/60'
          }`}
        >
          <svg width="34" height="34" viewBox="0 0 80 80" className="drop-shadow-md select-none">
            <polygon points="0,0 80,0 60,20 20,20" className={`${fillClase} stroke-slate-950 stroke-[3] transition-colors`} />
            <polygon points="0,0 20,20 20,60 0,80" className={`${fillClase} stroke-slate-950 stroke-[3] transition-colors`} />
            <polygon points="80,0 80,80 60,60 60,20" className={`${fillClase} stroke-slate-950 stroke-[3] transition-colors`} />
            <polygon points="20,60 60,60 80,80 0,80" className={`${fillClase} stroke-slate-950 stroke-[3] transition-colors`} />
            <polygon points="20,20 60,20 60,60 20,60" className={`${fillClase} stroke-slate-950 stroke-[3] transition-colors`} />
          </svg>
        </button>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-950 text-slate-100 p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl max-w-7xl mx-auto mb-12 space-y-8">
      
      {/* 1. Información General */}
      <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800/80">
        <h3 className="text-xs font-black text-slate-400 uppercase mb-6 flex items-center gap-2 tracking-widest">
          <FileText className="w-4 h-4 text-cyan-400" /> Información General
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre Completo" className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-sm md:col-span-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" required />
          <input value={infoGeneral.direccion} onChange={e => setInfoGeneral({ ...infoGeneral, direccion: e.target.value })} placeholder="Dirección" className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" />
          <input value={infoGeneral.ciudad} onChange={e => setInfoGeneral({ ...infoGeneral, ciudad: e.target.value })} placeholder="Ciudad" className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" />
          <input value={infoGeneral.tel_casa} onChange={e => setInfoGeneral({ ...infoGeneral, tel_casa: e.target.value })} placeholder="Tel. Casa" className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" />
          <input value={tel} onChange={e => setTel(e.target.value)} placeholder="Teléfono Celular" className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" />
          
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-wider">Fecha de Examen</label>
            <input type="date" value={infoGeneral.fecha_examen} onChange={e => setInfoGeneral({ ...infoGeneral, fecha_examen: e.target.value })} className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-sm w-full text-white focus:outline-none focus:border-cyan-500 color-scheme-dark" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-wider">Fecha de Nacimiento</label>
            <input type="date" value={infoGeneral.fecha_nacimiento} onChange={e => setInfoGeneral({ ...infoGeneral, fecha_nacimiento: e.target.value })} className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-sm w-full text-white focus:outline-none focus:border-cyan-500 color-scheme-dark" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <input value={infoGeneral.estado_civil} onChange={e => setInfoGeneral({ ...infoGeneral, estado_civil: e.target.value })} placeholder="Estado Civil" className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" />
          <input value={infoGeneral.ocupacion} onChange={e => setInfoGeneral({ ...infoGeneral, ocupacion: e.target.value })} placeholder="Ocupación" className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" />
          <input value={infoGeneral.recomendado_por} onChange={e => setInfoGeneral({ ...infoGeneral, recomendado_por: e.target.value })} placeholder="Recomendado por" className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" />
        </div>

        <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 p-4 bg-emerald-950/10 rounded-2xl border border-dashed border-emerald-900/60">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-emerald-400 ml-1 uppercase tracking-wider">Servicio / Tratamiento</label>
            <div className="relative">
              <Briefcase className="w-4 h-4 absolute left-3 top-3 text-emerald-500" />
              <input value={servicio} onChange={e => setServicio(e.target.value)} placeholder="Ej: Ortodoncia, Resinas..." className="w-full bg-slate-900 border border-slate-800 p-2.5 pl-9 rounded-xl text-sm text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none placeholder-slate-600" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-emerald-400 ml-1 uppercase tracking-wider">Costo Total (Q)</label>
            <input type="number" value={costo} onChange={e => setCosto(e.target.value)} placeholder="0.00" className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-sm font-mono text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none placeholder-slate-600" />
          </div>
        </div>
      </div>

      {/* 2. Historia Dental */}
      <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800/80">
        <h3 className="text-xs font-black text-emerald-400 uppercase mb-4 flex items-center gap-2 tracking-widest">
          <ClipboardList className="w-4 h-4" /> Historia Dental
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            ['primera_visita', '¿Es esta su primera visita?'],
            ['satisfactoria', 'Fue satisfactoria'],
            ['anestesia_local', 'Le pusieron anestesia local'],
            ['radiografias', 'Le tomaron radiografías'],
            ['higiene_oral', 'Instrucciones higiene oral'],
            ['visitas_periodicas', 'Visitas periódicas'],
            ['hubo_problema', '¿Hubo algún problema?']
          ].map(([id, label]) => (
            <label key={id} className="flex items-center gap-3 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 cursor-pointer hover:bg-slate-800/60 transition-colors text-slate-300">
              <input type="checkbox" checked={(historiaDental as any)[id]} onChange={e => setHistoriaDental({ ...historiaDental, [id]: e.target.checked })} className="rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-0 focus:ring-offset-0 w-4 h-4" />
              <span className="text-[11px] font-bold">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 3. Historia Médica */}
      <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800/80">
        <h3 className="text-xs font-black text-red-400 uppercase mb-4 flex items-center gap-2 tracking-widest">
          <Heart className="w-4 h-4" /> Historia Médica
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(historiaMedica)
            .filter(([key]) => key !== 'observaciones')
            .map(([key, value]) => (
              <label key={key} className="flex items-center gap-3 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 cursor-pointer hover:bg-slate-800/60 transition-colors text-slate-300">
                <input type="checkbox" checked={value as boolean} onChange={e => setHistoriaMedica({ ...historiaMedica, [key]: e.target.checked })} className="rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-0 focus:ring-offset-0 w-4 h-4" />
                <span className="text-[10px] font-bold capitalize">{key.replaceAll('_', ' ')}</span>
              </label>
            ))}
        </div>
        <textarea value={historiaMedica.observaciones} onChange={e => setHistoriaMedica({ ...historiaMedica, observaciones: e.target.value })} className="w-full bg-slate-900 border border-slate-800 mt-4 p-3 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none" rows={3} placeholder="Observaciones adicionales..." />
      </div>

      {/* 4. SECCIÓN DEL ODONTOGRAMA MINIMIZADO */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1 text-center md:text-left">
          <h3 className="font-black uppercase tracking-wider text-sm md:text-base text-cyan-400">Odontograma Clínico e Historial</h3>
          <p className="text-xs text-slate-400">
            {Object.keys(odontograma).length} dientes con hallazgos o tratamientos registrados en esta sesión.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsOdontogramaOpen(true)}
          className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black text-xs md:text-sm px-6 py-3 rounded-2xl flex items-center gap-2 transition-all active:scale-95 w-full md:w-auto justify-center shadow-md shadow-cyan-500/10"
        >
          <Maximize2 className="w-4 h-4" /> CONFIGURAR ODONTOGRAMA
        </button>
      </div>

      {/* MODAL EXPANDIDO COMPLETO */}
      {isOdontogramaOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-0 md:p-4 animate-fadeIn">
          <div className="bg-slate-900 w-full h-full md:max-w-7xl md:h-[95vh] md:rounded-[2.5rem] border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
            
            {/* Cabecera del Modal */}
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
              <div>
                <h3 className="text-white text-lg font-black uppercase tracking-wider">Editor Avanzado de Odontograma</h3>
                <p className="text-xs text-slate-400">Selecciona un diente para registrar estados y comentarios clínicos.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOdontogramaOpen(false);
                  setDienteActivo(null);
                }}
                className="bg-slate-800 hover:bg-red-500 hover:text-white text-slate-400 p-2.5 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              <div className="bg-slate-950/50 p-4 rounded-3xl border border-slate-800/80 overflow-x-auto">
                <div className="flex flex-col gap-6 w-max mx-auto p-2">
                  {/* Arcada Superior */}
                  <div className="flex gap-12">
                    <div className="flex gap-1.5 bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800/80">
                      {SECCIONES.SUP_DER.letras.map(l => <DienteComponent key={l} label={l} seccion="sup_der" />)}
                      <div className="w-2 border-r border-dashed border-slate-800 my-2"></div>
                      {SECCIONES.SUP_DER.numeros.map(n => <DienteComponent key={n} label={n} seccion="sup_der" />)}
                    </div>
                    <div className="flex gap-1.5 bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800/80">
                      {SECCIONES.SUP_IZQ.numeros.map(n => <DienteComponent key={n} label={n} seccion="sup_izq" />)}
                      <div className="w-2 border-r border-dashed border-slate-800 my-2"></div>
                      {SECCIONES.SUP_IZQ.letras.map(l => <DienteComponent key={l} label={l} seccion="sup_izq" />)}
                    </div>
                  </div>

                  {/* Arcada Inferior */}
                  <div className="flex gap-12">
                    <div className="flex gap-1.5 bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800/80">
                      {SECCIONES.INF_DER_BAJO.letras_v2.map(l => <DienteComponent key={l} label={l} seccion="inf_der" />)}
                      <div className="w-2 border-r border-dashed border-slate-800 my-2"></div>
                      {SECCIONES.INF_DER_BAJO.numeros_v2.map(n => <DienteComponent key={n} label={n} seccion="inf_der" />)}
                    </div>
                    <div className="flex gap-1.5 bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800/80">
                      {SECCIONES.INF_IZQ_BAJO.numeros_v2.map(n => <DienteComponent key={n} label={n} seccion="inf_izq" />)}
                      <div className="w-2 border-r border-dashed border-slate-800 my-2"></div>
                      {SECCIONES.INF_IZQ_BAJO.letras_v2.map(l => <DienteComponent key={l} label={l} seccion="inf_izq" />)}
                    </div>
                  </div>
                </div>
              </div>

              {/* INTERFACES DEL CANVAS INTEGRADOS DE FORMA REAL */}
              <div className="bg-slate-950/40 p-4 rounded-3xl border border-slate-800 relative min-h-[480px] flex flex-col items-center justify-center">
                {dienteActivo ? (
                  <div className="w-full space-y-4">
                    {/* Barra de herramientas flotante del lienzo */}
                    <div className="flex justify-between items-center bg-slate-900 p-2 rounded-xl border border-slate-800">
                      <OdontogramaToolbar 
                        tool={tool} 
                        setTool={setTool} 
                        strokeColor={strokeColor} 
                        setStrokeColor={setStrokeColor} 
                      />
                      <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase bg-cyan-950/60 px-3 py-1.5 rounded-lg border border-cyan-800/50">
                        Modo Dibujo Activo
                      </span>
                    </div>

                    {/* RENDERING REAL UTILIZANDO EL ESTADO INTERMEDIO REACTIVO */}
                    <OdontogramaCanvas 
                      dienteId={dienteActivo}
                      strokes={strokesTemporales}
                      setStrokes={(trazosNuevos) => {
                        // 1. Ejecutar actualización reactiva local en pantalla
                        setStrokesTemporales(trazosNuevos);
                        
                        // 2. Inyectar automáticamente el arreglo de vectores dentro del estado maestro
                        setOdontograma(prev => {
                          const copia = { ...prev };
                          const elementoActual = copia[dienteActivo] || { condicion: 'sano', completado: false, notas: '', strokes: [] };
                          
                          // Evaluamos si el callback de React es una función o un valor directo
                          const trazosActualizados = typeof trazosNuevos === 'function' 
                            ? trazosNuevos(elementoActual.strokes) 
                            : trazosNuevos;

                          copia[dienteActivo] = {
                            ...elementoActual,
                            strokes: trazosActualizados
                          };
                          return copia;
                        });
                      }}
                      tool={tool}
                      strokeWidth={strokeWidth}
                      strokeColor={strokeColor}
                      zoom={1}
                    />
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <p className="text-sm font-medium">No hay ningún diente seleccionado.</p>
                    <p className="text-xs mt-1">Haz clic sobre cualquier diente de la arcada superior o inferior para cargar su lienzo anatómico y dibujar.</p>
                  </div>
                )}
              </div>

              {/* PANEL DE DETALLE Y CONDICIONES */}
              <div className="bg-slate-950/30 border border-slate-800 rounded-3xl p-6 min-h-[160px] flex flex-col justify-center">
                {dienteActivo ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
                    
                    {/* Columna 1: Info del Diente */}
                    <div className="flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-slate-800 pb-4 lg:pb-0">
                      <span className="text-xs font-black text-cyan-400 tracking-widest uppercase">DIENTE SELECCIONADO</span>
                      <h4 className="text-3xl font-black text-white capitalize mt-1">
                        {dienteActivo.replace('_', ' ')}
                      </h4>
                      <p className="text-slate-400 text-xs mt-2">
                        Estado actual: <span className="text-white font-bold capitalize">{odontograma[dienteActivo]?.condicion || 'sano'}</span>
                      </p>
                    </div>

                    {/* Columna 2: Selector de Estados */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase block mb-1">CAMBIAR CONDICIÓN</span>
                      <div className="grid grid-cols-1 gap-1.5 max-h-[150px] overflow-y-auto pr-1">
                        {ESTADOS.map(e => {
                          const isSelected = (odontograma[dienteActivo]?.condicion || 'sano') === e.id;
                          return (
                            <button
                              key={e.label}
                              type="button"
                              onClick={() => {
                                setOdontograma(prev => {
                                  const copia = { ...prev };
                                  const dentalExistente = copia[dienteActivo] || { condicion: 'sano', completado: false, notas: '', strokes: [] };
                                  copia[dienteActivo] = { 
                                    ...dentalExistente,
                                    condicion: e.id, 
                                    completado: e.completado, 
                                  };
                                  return copia;
                                });
                              }}
                              className={`text-left px-3 py-2.5 rounded-lg text-xs font-bold flex items-center gap-3 border transition-all ${
                                isSelected
                                  ? 'bg-slate-800 border-cyan-400 text-white scale-[1.01] shadow-md'
                                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                              }`}
                            >
                              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${e.color}`} />
                              <span className="truncate">{e.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Columna 3: Entrada de Notas */}
                    <div className="flex flex-col justify-between">
                      <div className="flex flex-col h-full">
                        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase block mb-1">
                          NOTAS CLÍNICAS / EVOLUCIÓN
                        </span>
                        <textarea
                          value={odontograma[dienteActivo]?.notas || odontograma[dienteActivo]?.notas || ''}
                          onChange={e => {
                            setOdontograma(prev => {
                              const copia = { ...prev };
                              if (!copia[dienteActivo]) {
                                copia[dienteActivo] = { condicion: 'sano', completado: false, notas: '', strokes: [] };
                              }
                              copia[dienteActivo].notas = e.target.value;
                              return copia;
                            });
                          }}
                          placeholder="Escribe aquí el diagnóstico, observaciones o notas de evolución..."
                          className="w-full flex-1 bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 resize-none min-h-[90px]"
                        />
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-500">
                    <p className="text-xs">Selecciona un diente de la arcada para habilitar notas y estados.</p>
                  </div>
                )}
              </div>

            </div>

            {/* Pie del Modal */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
              <button 
                type="button" 
                onClick={() => {
                  if(confirm('¿Estás seguro de reiniciar el odontograma de esta sesión?')) {
                    setOdontograma({});
                    setStrokesTemporales([]);
                  }
                }} 
                className="text-slate-400 hover:text-red-400 text-xs flex items-center gap-2 transition-colors px-3 py-2"
              >
                <RotateCcw className="w-4 h-4" /> Reiniciar Cambios Visuales
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOdontogramaOpen(false);
                  setDienteActivo(null);
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" /> CONFIRMAR Y VOLVER AL FORMULARIO
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Botón Principal del Formulario */}
      <button type="submit" className="w-full py-5 bg-cyan-500 text-slate-950 rounded-3xl font-black text-xl flex items-center justify-center gap-4 hover:bg-cyan-400 transition-all shadow-xl active:scale-[0.98]">
        {isEditing ? <Save className="w-6 h-6" /> : <PlusCircle className="w-6 h-6" />}
        {isEditing ? 'ACTUALIZAR EXPEDIENTE' : 'CREAR EXPEDIENTE'}
      </button>
    </form>
  );
};
