import React, { useState, useEffect } from 'react';
// Importación corregida según tu estructura de proyecto
import { supabase } from '../lib/supabase';

// Tipado para el estado de cada diente
interface DienteEstado {
  condicion: string;
  completado: boolean;
  notas: string;
}

interface OdontogramaEditorProps {
  pacienteId: string;
  onClose: () => void;
}

export const OdontogramaEditor: React.FC<OdontogramaEditorProps> = ({ pacienteId, onClose }) => {
  // Estado que almacena el diccionario de todos los dientes con sus datos
  const [odontogramaData, setOdontogramaData] = useState<Record<string, DienteEstado>>({});
  // ID del diente seleccionado actualmente (ej: 'a_sup_der')
  const [dienteSeleccionado, setDienteSeleccionado] = useState<string | null>(null);
  // Estado local para controlar el textarea de forma reactiva
  const [notaActual, setNotaActual] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // 1. Cargar datos iniciales desde Supabase incluyendo la columna 'notas'
  useEffect(() => {
    const fetchOdontograma = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('odontograma')
          .select('numero_diente, estado, notas')
          .eq('paciente_id', pacienteId);

        if (error) throw error;

        if (data) {
          const mapeoDientes: Record<string, DienteEstado> = {};
          data.forEach((item) => {
            // Validar si el estado viene mapeado como objeto o string JSON
            const estadoJson = typeof item.estado === 'string' ? JSON.parse(item.estado) : item.estado;
            
            mapeoDientes[item.numero_diente.toLowerCase()] = {
              condicion: estadoJson?.condicion || 'sano',
              completado: estadoJson?.completado || false,
              notas: item.notas || '' // <-- AQUÍ SE CORRIGE: Recuperamos la nota de la BD
            };
          });
          setOdontogramaData(mapeoDientes);
        }
      } catch (err) {
        console.error("Error cargando odontograma:", err);
      } finally {
        setLoading(false);
      }
    };

    if (pacienteId) {
      fetchOdontograma();
    }
  }, [pacienteId]);

  // 2. Sincronizar el textarea cada vez que el usuario cambia de diente seleccionado
  useEffect(() => {
    if (dienteSeleccionado) {
      const datosDiente = odontogramaData[dienteSeleccionado.toLowerCase()];
      // Si el diente ya tiene datos en el estado, cargamos su nota; si no, vacío
      setNotaActual(datosDiente ? datosDiente.notas : '');
    } else {
      setNotaActual('');
    }
  }, [dienteSeleccionado, odontogramaData]);

  // 3. Manejador para cambiar la condición (Sano, Caries, Trabajado, etc.)
  const handleCambiarCondicion = (nuevaCondicion: string, esCompletado: boolean) => {
    if (!dienteSeleccionado) return;

    const idDienteKey = dienteSeleccionado.toLowerCase();
    
    setOdontogramaData((prev) => ({
      ...prev,
      [idDienteKey]: {
        condicion: nuevaCondicion,
        completado: esCompletado,
        notas: notaActual // Mantiene la nota que esté escrita en ese instante
      }
    }));
  };

  // 4. Guardar los cambios definitivos en Supabase (botón "Confirmar y Volver")
  const handleConfirmarCambios = async () => {
    if (!dienteSeleccionado) return;
    
    const idDienteKey = dienteSeleccionado.toLowerCase();
    const datosA_Guardar = odontogramaData[idDienteKey];

    if (!datosA_Guardar) return;

    try {
      // Estructuramos el JSON tal y como lo tienes en tu base de datos
      const estadoJson = {
        condicion: datosA_Guardar.condicion,
        completado: datosA_Guardar.completado
      };

      // Hacemos el upsert en Supabase basándonos en paciente_id y numero_diente
      const { error } = await supabase
        .from('odontograma')
        .upsert({
          paciente_id: pacienteId,
          numero_diente: idDienteKey,
          estado: estadoJson, // Se guarda como objeto JSON
          notas: notaActual   // <-- AQUÍ SE GUARDA: Sincroniza el texto actual de la nota
        }, { onConflict: 'paciente_id,numero_diente' });

      if (error) throw error;

      alert("Odontograma actualizado con éxito.");
      onClose(); // Cierra el modal o redirige
    } catch (err) {
      console.error("Error al guardar en Supabase:", err);
      alert("Hubo un error al guardar los datos.");
    }
  };

  if (loading) return <div className="text-white">Cargando Odontograma...</div>;

  // Obtenemos los datos visuales del diente seleccionado actualmente para renderizar la UI
  const infoDienteActual = dienteSeleccionado ? odontogramaData[dienteSeleccionado.toLowerCase()] : null;

  return (
    <div className="odontograma-container bg-[#0b111e] text-white p-6 rounded-lg min-h-screen">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-wide">EDITOR AVANZADO DE ODONTOGRAMA</h2>
          <p className="text-gray-400 text-sm">Selecciona un diente para registrar estados y comentarios clínicos.</p>
        </div>
        <button onClick={onClose} className="bg-gray-800 p-2 rounded-md hover:bg-gray-700">✕</button>
      </div>

      {/* Grid del Odontograma (Simplificado para el ejemplo de renderizado) */}
      <div className="grid-dientes mb-8 p-4 bg-[#0f172a] rounded-lg border border-gray-800">
        <p className="text-xs text-gray-500 mb-2">Arcada Dental (Haz clic en un cuadrante/botón para probar)</p>
        <div className="flex gap-2 flex-wrap">
          {/* Botón de ejemplo para el diente con el problema */}
          <button 
            onClick={() => setDienteSeleccionado('a_sup_der')}
            className={`p-4 rounded border text-center transition-all ${
              dienteSeleccionado === 'a_sup_der' ? 'border-cyan-400 bg-cyan-950' : 'border-gray-700 bg-slate-900'
            }`}
          >
            <div className="text-xs font-bold">A Sup_der</div>
            <span className="text-[10px] block text-gray-400">
              ({odontogramaData['a_sup_der']?.condicion || 'sano'})
            </span>
          </button>
          
          {/* Aquí mapearías el resto de tus bloques de dientes */}
        </div>
      </div>

      {/* Panel Inferior Dinámico de Formulario */}
      <div className="bg-[#0f172a] border border-gray-800 p-6 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Columna 1: Info Diente */}
        <div>
          <span className="text-cyan-400 font-bold text-xs uppercase tracking-wider block mb-1">Diente Seleccionado</span>
          <h3 className="text-2xl font-black">{dienteSeleccionado ? "A Sup_der" : "Ninguno seleccionado"}</h3>
          <p className="text-sm text-gray-400 mt-2">
            Estado actual: <span className="font-bold text-white capitalize">{infoDienteActual?.condicion || 'Sano'}</span>
          </p>
        </div>

        {/* Columna 2: Selector de Condiciones */}
        <div>
          <span className="text-gray-400 font-bold text-xs uppercase tracking-wider block mb-3">Cambiar Condición</span>
          {dienteSeleccionado ? (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button 
                onClick={() => handleCambiarCondicion('sano', false)}
                className={`p-2 rounded text-left ${infoDienteActual?.condicion === 'sano' ? 'bg-emerald-600' : 'bg-gray-800'}`}
              >
                🟢 Sano
              </button>
              <button 
                onClick={() => handleCambiarCondicion('caries', false)}
                className={`p-2 rounded text-left ${infoDienteActual?.condicion === 'caries' && !infoDienteActual.completado ? 'bg-red-600' : 'bg-gray-800'}`}
              >
                🔴 Caries (Pendiente)
              </button>
              <button 
                onClick={() => handleCambiarCondicion('trabajado', true)}
                className={`p-2 rounded text-left ${infoDienteActual?.condicion === 'trabajado' ? 'bg-blue-600' : 'bg-gray-800'}`}
              >
                🔵 Trabajado
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">Haz clic sobre cualquier diente de la arcada para registrar su diagnóstico.</p>
          )}
        </div>

        {/* Columna 3: Notas Clínicas */}
        <div className="flex flex-col">
          <span className="text-gray-400 font-bold text-xs uppercase tracking-wider block mb-2">Notas Clínicas / Evolución</span>
          <textarea
            value={notaActual}
            disabled={!dienteSeleccionado}
            onChange={(e) => setNotaActual(e.target.value)}
            placeholder={dienteSeleccionado ? "Escribe aquí el diagnóstico, observaciones o notas..." : "Primero asigna un estado para escribir notas"}
            className="w-full flex-grow p-3 bg-[#070c16] border border-gray-800 rounded text-sm text-gray-300 focus:outline-none focus:border-cyan-500 resize-none min-h-[80px]"
          />
        </div>
      </div>

      {/* Botón de Confirmación Principal */}
      <div className="mt-6 flex justify-end gap-4">
        <button 
          onClick={() => { setDienteSeleccionado(null); setNotaActual(''); }} 
          className="text-gray-400 hover:text-white text-sm"
        >
          Reiniciar Cambios Visuales
        </button>
        <button
          onClick={handleConfirmarCambios}
          disabled={!dienteSeleccionado}
          className="bg-[#10b981] hover:bg-[#059669] text-slate-950 font-bold px-6 py-3 rounded-md transition-colors text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ✓ CONFIRMAR Y VOLVER AL FORMULARIO
        </button>
      </div>
    </div>
  );
};
