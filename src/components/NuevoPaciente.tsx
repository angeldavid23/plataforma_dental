import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  PlusCircle,
  User,
  Phone,
  DollarSign,
  ClipboardList,
  Save,
  RotateCcw,
  FileText,
  Activity,
  MapPin,
  Briefcase,
  Calendar,
  Heart
} from 'lucide-react';

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
  { label: 'Sano', color: 'bg-emerald-500' },
  { label: 'Caries', color: 'bg-red-500' },
  { label: 'Ausente', color: 'bg-slate-800' },
  { label: 'Resina', color: 'bg-blue-500' },
  { label: 'Corona', color: 'bg-amber-500' }
];

export const NuevoPaciente = ({
  onCreated,
  datosIniciales
}: NuevoPacienteProps) => {

  const isEditing = !!datosIniciales?.id;

  const [nombre, setNombre] = useState('');
  const [tel, setTel] = useState('');
  const [servicio, setServicio] = useState('');
  const [costo, setCosto] = useState('');

  // =========================
  // INFORMACIÓN GENERAL
  // =========================

  const [infoGeneral, setInfoGeneral] = useState({
    direccion: '',
    tel_casa: '',
    tel_oficina: '',
    ciudad: '',
    fecha_examen: '',

    fecha_nacimiento: '',
    estado_civil: '',
    ocupacion: '',
    ocupacion_direccion: '',
    ocupacion_tel: '',

    recomendado_por: '',
    referido_por: '',

    persona_responsable: '',
    responsable_direccion: '',
    responsable_tel: '',

    medico_personal: '',
    medico_tel: '',

    odontologo_anterior: '',
    odontologo_tel: '',

    direccion_cobrar: '',
    estimado: ''
  });

  // =========================
  // HISTORIA DENTAL
  // =========================

  const [historiaDental, setHistoriaDental] = useState({
    primera_visita: false,
    satisfactoria: false,
    anestesia_local: false,
    radiografias: false,
    higiene_oral: false,
    visitas_periodicas: false,
    hubo_problema: false,

    sensibilidad: {
      calor: false,
      dulces: false,
      masticacion: false,
      frio: false,
      lesiones_previas: false
    },

    historia_de: {
      chuparse_dedo: false,
      protrusion_lingual: false,
      onicofagia: false,
      dificultad_tragar: false,
      respiracion_bucal: false,
      mordedor_objetos: false
    }
  });

  // =========================
  // HISTORIA MÉDICA
  // =========================

  const [historiaMedica, setHistoriaMedica] = useState({
    examen_fisico: false,
    cardiacos: false,
    presion_alta: false,
    presion_baja: false,
    circulatorios: false,
    nerviosos: false,
    radiacion: false,
    region_auditiva: false,
    sangramiento_excesivo: false,
    encias_sangrantes: false,
    empaque_alimenticio: false,
    fluor: false,
    vitalidad_pulpar: false,
    alergia_anestesicos: false,
    alergia_antibioticos: false,

    otras_alergias: false,
    amigdalectomia: false,
    adenoides: false,
    anemia: false,
    artritis: false,
    asma: false,
    encefalitis: false,
    viruela: false,
    sinusitis: false,
    epilepsia: false,
    tumores: false,

    mastoiditis: false,
    otitis: false,
    paperas: false,
    nefrosis: false,
    fiebre_reumatica: false,
    escarlatina: false,
    tifoidea: false,
    amigdalitis: false,
    tuberculosis: false,
    sifilis: false,

    observaciones: ''
  });

  const [odontograma, setOdontograma] = useState<Record<string, string>>({});
  const [dienteActivo, setDienteActivo] = useState<string | null>(null);

  // =========================
  // CARGAR DATOS
  // =========================

  useEffect(() => {
    if (isEditing && datosIniciales) {

      setNombre(datosIniciales.nombre_completo || '');
      setTel(datosIniciales.telefono || '');

      if (datosIniciales.tratamientos?.[0]) {
        setServicio(datosIniciales.tratamientos[0].nombre_servicio || '');
        setCosto(
          datosIniciales.tratamientos[0].costo_total?.toString() || ''
        );
      }

      if (datosIniciales.antecedentes) {
        const ant = datosIniciales.antecedentes;

        if (ant.infoGeneral) setInfoGeneral(ant.infoGeneral);
        if (ant.historiaDental) setHistoriaDental(ant.historiaDental);
        if (ant.historiaMedica) setHistoriaMedica(ant.historiaMedica);
      }

      if (datosIniciales.odontograma) {
        const mapa: Record<string, string> = {};

        datosIniciales.odontograma.forEach((d: any) => {
          mapa[d.numero_diente] = d.estado;
        });

        setOdontograma(mapa);
      }
    }
  }, [datosIniciales, isEditing]);

  // =========================
  // GUARDAR
  // =========================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let pacienteId = datosIniciales?.id;
      const costoNumerico = parseFloat(costo) || 0;

      const antecedentes = {
        infoGeneral,
        historiaDental,
        historiaMedica
      };

      if (isEditing) {
        // ACTUALIZAR PACIENTE
        await supabase
          .from('pacientes')
          .update({
            telefono: tel,
            antecedentes
          })
          .eq('id', pacienteId);

        // ACTUALIZAR TRATAMIENTO
        await supabase
          .from('tratamientos')
          .update({
            nombre_servicio: servicio,
            costo_total: costoNumerico,
            saldo_pendiente: costoNumerico // Nota: Aquí podrías ajustar si ya hay abonos
          })
          .eq('paciente_id', pacienteId);

        // REINICIAR ODONTOGRAMA PARA VOLVER A INSERTAR
        await supabase
          .from('odontograma')
          .delete()
          .eq('paciente_id', pacienteId);

      } else {
        // CREAR PACIENTE
        const { data: paciente, error } = await supabase
          .from('pacientes')
          .insert([
            {
              nombre_completo: nombre,
              telefono: tel,
              antecedentes
            }
          ])
          .select()
          .single();

        if (error) throw error;

        pacienteId = paciente.id;

        // CREAR TRATAMIENTO INICIAL
        await supabase
          .from('tratamientos')
          .insert([
            {
              paciente_id: pacienteId,
              nombre_servicio: servicio || 'Tratamiento Inicial',
              costo_total: costoNumerico,
              saldo_pendiente: costoNumerico
            }
          ]);
      }

      // GUARDAR ODONTOGRAMA
      const registros = Object.entries(odontograma).map(
        ([numero_diente, estado]) => ({
          paciente_id: pacienteId,
          numero_diente,
          estado
        })
      );

      if (registros.length > 0) {
        await supabase.from('odontograma').insert(registros);
      }

      alert(
        isEditing
          ? 'Expediente actualizado'
          : 'Expediente creado'
      );

      onCreated();

    } catch (err: any) {
      alert(err.message);
    }
  };

  // =========================
  // COMPONENTE DIENTE
  // =========================

  const DienteComponent = ({
    label,
    seccion
  }: {
    label: string;
    seccion: string;
  }) => {

    const id = `${label}_${seccion}`.toLowerCase();
    const estado = odontograma[id] || 'sano';

    return (
      <div className="flex flex-col items-center relative">
        <div className="bg-slate-900 text-white w-7 text-[9px] font-bold py-0.5 rounded-t-sm flex justify-center">
          {label}
        </div>

        <button
          type="button"
          onClick={() =>
            setDienteActivo(
              dienteActivo === id ? null : id
            )
          }
          className={`w-7 h-10 border ${
            ESTADOS.find(
              e => e.label.toLowerCase() === estado
            )?.color || 'bg-emerald-500'
          }`}
        >
          <div className="w-2 h-3 border border-white/30 rounded-sm mx-auto"></div>
        </button>

        {dienteActivo === id && (
          <div className="absolute top-full mt-1 w-28 bg-white shadow-xl rounded border z-[999] p-1">
            {ESTADOS.map(e => (
              <button
                key={e.label}
                type="button"
                onClick={() => {
                  const copia = { ...odontograma };
                  if (e.label.toLowerCase() === 'sano') {
                    delete copia[id];
                  } else {
                    copia[id] = e.label.toLowerCase();
                  }
                  setOdontograma(copia);
                  setDienteActivo(null);
                }}
                className="w-full text-left px-2 py-1 hover:bg-slate-100 text-[9px] font-bold flex items-center gap-2"
              >
                <div className={`w-2 h-2 rounded-full ${e.color}`} />
                {e.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-[2rem] border shadow-2xl max-w-7xl mx-auto mb-12 space-y-8"
    >

      {/* ENCABEZADO / INFORMACIÓN GENERAL */}
      <div className="bg-slate-50 p-6 rounded-3xl border">
        <h3 className="text-xs font-black text-slate-500 uppercase mb-6 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Información General
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Nombre Completo"
            className="border p-2.5 rounded-xl text-sm md:col-span-2"
            required
          />

          <input
            value={infoGeneral.direccion}
            onChange={e => setInfoGeneral({ ...infoGeneral, direccion: e.target.value })}
            placeholder="Dirección"
            className="border p-2.5 rounded-xl text-sm"
          />

          <input
            value={infoGeneral.ciudad}
            onChange={e => setInfoGeneral({ ...infoGeneral, ciudad: e.target.value })}
            placeholder="Ciudad"
            className="border p-2.5 rounded-xl text-sm"
          />

          <input
            value={infoGeneral.tel_casa}
            onChange={e => setInfoGeneral({ ...infoGeneral, tel_casa: e.target.value })}
            placeholder="Tel. Casa"
            className="border p-2.5 rounded-xl text-sm"
          />

          <input
            value={tel}
            onChange={e => setTel(e.target.value)}
            placeholder="Teléfono Celular"
            className="border p-2.5 rounded-xl text-sm"
          />

          <label className="text-[10px] font-black text-slate-500 ml-1 uppercase">
            Fecha de Examen
          
          <input
            type="date"
            value={infoGeneral.fecha_examen}
            onChange={e =>
              setInfoGeneral({ ...infoGeneral, fecha_examen: e.target.value })
            }
            className="border p-2.5 rounded-xl text-sm w-full"
          />
          </label>
            <label className="text-[10px] font-black text-slate-500 ml-1 uppercase">
            Fecha de Nacimiento
          
          <input
            type="date"
            value={infoGeneral.fecha_nacimiento}
            onChange={e =>
              setInfoGeneral({ ...infoGeneral, fecha_nacimiento: e.target.value })
            }
            className="border p-2.5 rounded-xl text-sm w-full"
          /></label>
        </div>

        
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-slate-500 ml-1 uppercase">
    
          </label>
          <input
            value={infoGeneral.estado_civil}
            onChange={e => setInfoGeneral({ ...infoGeneral, estado_civil: e.target.value })}
            placeholder="Estado Civil"
            className="border p-2.5 rounded-xl text-sm"
          />

          <input
            value={infoGeneral.ocupacion}
            onChange={e => setInfoGeneral({ ...infoGeneral, ocupacion: e.target.value })}
            placeholder="Ocupación"
            className="border p-2.5 rounded-xl text-sm"
          />

          <input
            value={infoGeneral.recomendado_por}
            onChange={e => setInfoGeneral({ ...infoGeneral, recomendado_por: e.target.value })}
            placeholder="Recomendado por"
            className="border p-2.5 rounded-xl text-sm"
          />

          {/* CAMPOS DE COSTO Y SERVICIO (NUEVOS) */}
          <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 p-4 bg-emerald-50/50 rounded-2xl border border-dashed border-emerald-200">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-emerald-700 ml-1">SERVICIO / TRATAMIENTO</label>
              <div className="relative">
                <Briefcase className="w-4 h-4 absolute left-3 top-3 text-emerald-600" />
                <input
                  value={servicio}
                  onChange={e => setServicio(e.target.value)}
                  placeholder="Ej: Ortodoncia, Resinas..."
                  className="w-full border p-2.5 pl-9 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-emerald-700 ml-1">COSTO TOTAL (Q)</label>
              <div className="relative">

                <input
                  type="number"
                  value={costo}
                  onChange={e => setCosto(e.target.value)}
                  placeholder="0.00"
                  className="w-full border p-2.5 pl-9 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HISTORIA DENTAL */}
      <div className="bg-emerald-50 p-6 rounded-3xl border">
        <h3 className="text-xs font-black text-emerald-700 uppercase mb-4 flex items-center gap-2">
          <ClipboardList className="w-4 h-4" />
          Historia Dental
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
            <label key={id} className="flex items-center gap-2 bg-white p-2 rounded-lg border cursor-pointer hover:bg-slate-50 transition-colors">
              <input
                type="checkbox"
                checked={(historiaDental as any)[id]}
                onChange={e => setHistoriaDental({ ...historiaDental, [id]: e.target.checked })}
              />
              <span className="text-[11px] font-bold">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* HISTORIA MÉDICA */}
      <div className="bg-red-50 p-6 rounded-3xl border">
        <h3 className="text-xs font-black text-red-700 uppercase mb-4 flex items-center gap-2">
          <Heart className="w-4 h-4" />
          Historia Médica
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(historiaMedica)
            .filter(([key]) => key !== 'observaciones')
            .map(([key, value]) => (
              <label key={key} className="flex items-center gap-2 bg-white p-2 rounded-lg border cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={value as boolean}
                  onChange={e => setHistoriaMedica({ ...historiaMedica, [key]: e.target.checked })}
                />
                <span className="text-[10px] font-bold capitalize">{key.replaceAll('_', ' ')}</span>
              </label>
            ))}
        </div>
        <textarea
          value={historiaMedica.observaciones}
          onChange={e => setHistoriaMedica({ ...historiaMedica, observaciones: e.target.value })}
          className="w-full border mt-4 p-3 rounded-xl text-sm"
          rows={3}
          placeholder="Observaciones adicionales..."
        />
      </div>

      {/* ODONTOGRAMA */}
      <div className="bg-slate-900 p-8 rounded-[3rem]">
        <h3 className="text-center text-white font-black mb-8 uppercase tracking-widest">Odontograma</h3>
        <div className="flex flex-col gap-8 overflow-x-auto">
          <div className="flex justify-center gap-10 min-w-fit">
            <div className="flex gap-0.5">
              {SECCIONES.SUP_DER.letras.map(l => (
                <DienteComponent key={l} label={l} seccion="sup_der" />
              ))}
              <div className="w-2"></div>
              {SECCIONES.SUP_DER.numeros.map(n => (
                <DienteComponent key={n} label={n} seccion="sup_der" />
              ))}
            </div>
            <div className="flex gap-0.5">
              {SECCIONES.SUP_IZQ.numeros.map(n => (
                <DienteComponent key={n} label={n} seccion="sup_izq" />
              ))}
              <div className="w-2"></div>
              {SECCIONES.SUP_IZQ.letras.map(l => (
                <DienteComponent key={l} label={l} seccion="sup_izq" />
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-10 min-w-fit">
            <div className="flex gap-0.5">
              {SECCIONES.INF_DER_BAJO.letras_v2.map(l => (
                <DienteComponent key={l} label={l} seccion="inf_der" />
              ))}
              <div className="w-2"></div>
              {SECCIONES.INF_DER_BAJO.numeros_v2.map(n => (
                <DienteComponent key={n} label={n} seccion="inf_der" />
              ))}
            </div>
            <div className="flex gap-0.5">
              {SECCIONES.INF_IZQ_BAJO.numeros_v2.map(n => (
                <DienteComponent key={n} label={n} seccion="inf_izq" />
              ))}
              <div className="w-2"></div>
              {SECCIONES.INF_IZQ_BAJO.letras_v2.map(l => (
                <DienteComponent key={l} label={l} seccion="inf_izq" />
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOdontograma({})}
          className="mt-6 text-white text-xs flex items-center gap-2 mx-auto hover:text-red-400 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reiniciar Odontograma
        </button>
      </div>

      {/* BOTÓN FINAL */}
      <button
        type="submit"
        className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-xl flex items-center justify-center gap-4 hover:bg-slate-800 transition-all shadow-xl active:scale-[0.98]"
      >
        {isEditing ? <Save className="w-6 h-6" /> : <PlusCircle className="w-6 h-6" />}
        {isEditing ? 'ACTUALIZAR EXPEDIENTE' : 'CREAR EXPEDIENTE'}
      </button>
    </form>
  );
};
