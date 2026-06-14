import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { OdontogramaToolbar } from './odontogram/OdontogramToolbar.tsx';
import { OdontogramaCanvas } from './odontogram/OdontogramCanvas.tsx';

interface Stroke {
  id: string;
  tool: 'pen' | 'eraser';
  strokeWidth: number;
  color: string;
  points: number[];
}

interface DienteEstado {
  condicion: string;
  completado: boolean;
  notas: string;
  strokes: Stroke[];
}

interface OdontogramaEditorProps {
  pacienteId: string;
  onClose: () => void;
}

export const OdontogramaEditor: React.FC<OdontogramaEditorProps> = ({ pacienteId, onClose }) => {
  const [odontogramaData, setOdontogramaData] = useState<Record<string, DienteEstado>>({});
  const [dienteSeleccionado, setDienteSeleccionado] = useState<string | null>(null);
  
  const [notaActual, setNotaActual] = useState<string>('');
  const [strokesActuales, setStrokesActuales] = useState<Stroke[]>([]);
  
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [strokeColor, setStrokeColor] = useState<string>('#EF4444');
  const [strokeWidth] = useState<number>(4);
  const [loading, setLoading] = useState<boolean>(true);
  const canvasRef = useRef<any>(null);

  // 1. Cargar historial clínico desde Supabase
  useEffect(() => {
    const fetchOdontograma = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('odontograma')
          .select('numero_diente, estado, notas, strokes')
          .eq('paciente_id', pacienteId);

        if (error) throw error;

        const dataFormateada: Record<string, DienteEstado> = {};
        data?.forEach((row) => {
          let strokesParsed: Stroke[] = [];
          if (row.strokes) {
            strokesParsed = typeof row.strokes === 'string' ? JSON.parse(row.strokes) : row.strokes;
          }

          dataFormateada[row.numero_diente] = {
            condicion: row.estado || 'sano',
            completado: false,
            notas: row.notas || '',
            strokes: strokesParsed
          };
        });

        setOdontogramaData(dataFormateada);
      } catch (err) {
        console.error('Error al cargar el odontograma:', err);
      } finally {
        setLoading(false);
      }
    };

    if (pacienteId) {
      fetchOdontograma();
    }
  }, [pacienteId]);

  // 2. Selección de un diente: Sincroniza estados del canvas y las notas
  const handleSeleccionarDiente = (dienteId: string) => {
    setDienteSeleccionado(dienteId);
    const datosDiente = odontogramaData[dienteId] || {
      condicion: 'sano',
      completado: false,
      notas: '',
      strokes: []
    };
    setNotaActual(datosDiente.notas);
    setStrokesActuales(datosDiente.strokes || []);
  };

  // 3. Sincroniza los trazos del lienzo con el estado maestro
  const handleStrokesChange = (nuevosStrokes: React.SetStateAction<Stroke[]>) => {
    setStrokesActuales((prev) => {
      const resolvedStrokes = typeof nuevosStrokes === 'function' ? nuevosStrokes(prev) : nuevosStrokes;
      
      if (dienteSeleccionado) {
        setOdontogramaData((prevData) => ({
          ...prevData,
          [dienteSeleccionado]: {
            ...(prevData[dienteSeleccionado] || { condicion: 'sano', completado: false, notas: '' }),
            strokes: resolvedStrokes
          }
        }));
      }
      return resolvedStrokes;
    });
  };

  // 4. Corrección del Typo: Cambiar condición clínica
  const handleCambiarCondicion = (nuevaCondicion: string) => {
    if (!dienteSeleccionado) return;

    setOdontogramaData((prev) => ({
      ...prev,
      [dienteSeleccionado]: {
        ...(prev[dienteSeleccionado] || { completado: false, notas: '', strokes: [] }),
        condicion: nuevaCondicion // <-- Arreglado aquí 'nuevaCondicion'
      }
    }));
  };

  // 5. Modificar notas clínicas
  const handleNotasChange = (texto: string) => {
    setNotaActual(texto);
    if (!dienteSeleccionado) return;

    setOdontogramaData((prev) => ({
      ...prev,
      [dienteSeleccionado]: {
        ...(prev[dienteSeleccionado] || { condicion: 'sano', completado: false, strokes: [] }),
        notas: texto
      }
    }));
  };

  // 6. Guardado Masivo en Supabase (Soporta transacciones concurrentes eficientemente)
  const handleConfirmarCambios = async () => {
    const records = Object.entries(odontogramaData).map(([numeroDiente, info]) => ({
      paciente_id: pacienteId,
      numero_diente: numeroDiente,
      estado: info.condicion,
      notas: info.notas,
      strokes: info.strokes
    }));

    if (records.length === 0) {
      alert('No hay cambios clínicos que guardar.');
      return;
    }

    try {
      const { error } = await supabase
        .from('odontograma')
        .upsert(records, { onConflict: 'paciente_id,numero_diente' });

      if (error) throw error;

      alert('Odontograma completo sincronizado y guardado con éxito.');
    } catch (err) {
      console.error('Error al guardar en la base de datos:', err);
      alert('Ocurrió un error al persistir los trazos gráficos.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-cyan-400 font-bold">
        Cargando historial clínico...
      </div>
    );
  }

  return (
    <div className="bg-[#0a1120] text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-2xl max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-wide">Odontograma Clínico</h2>
          <p className="text-xs text-slate-400">Selecciona el número de pieza para trazar diagnósticos o ingresar hallazgos</p>
        </div>
        <div className="flex gap-2">
          {['16', '11', '21', '26', '36', '46'].map((num) => (
            <button
              key={num}
              onClick={() => handleSeleccionarDiente(num)}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                dienteSeleccionado === num 
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20' 
                  : 'bg-slate-900 border border-slate-800 hover:border-slate-700'
              }`}
            >
              Pieza {num}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-900 mb-6 flex justify-center items-center overflow-hidden">
        <OdontogramaCanvas
          ref={canvasRef}
          dienteId={dienteSeleccionado}
          strokes={strokesActuales}
          setStrokes={handleStrokesChange}
          tool={tool}
          strokeWidth={strokeWidth}
          strokeColor={strokeColor}
          zoom={1}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="flex flex-col gap-2">
          <span className="text-gray-400 font-bold text-xs uppercase tracking-wider block">Paleta Gráfica</span>
          <OdontogramaToolbar 
            tool={tool} 
            setTool={setTool} 
            strokeColor={strokeColor} 
            setStrokeColor={setStrokeColor} 
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-gray-400 font-bold text-xs uppercase tracking-wider block">Diagnósticos Rápidos</span>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'sano', label: 'Sano', color: 'bg-emerald-600/20 border-emerald-800 text-emerald-400' },
              { id: 'caries', label: 'Caries', color: 'bg-red-600/20 border-red-800 text-red-400' },
              { id: 'tratado', label: 'Tratado', color: 'bg-blue-600/20 border-blue-800 text-blue-400' },
              { id: 'ausente', label: 'Ausente', color: 'bg-slate-600/20 border-slate-800 text-slate-400' },
            ].map((cond) => (
              <button
                key={cond.id}
                type="button"
                onClick={() => handleCambiarCondicion(cond.id)}
                className={`p-2.5 rounded border text-xs font-semibold transition-all ${cond.color} ${
                  odontogramaData[dienteSeleccionado || '']?.condicion === cond.id 
                    ? 'ring-2 ring-white scale-[1.02]' 
                    : 'opacity-60 hover:opacity-100'
                }`}
                disabled={!dienteSeleccionado}
              >
                {cond.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col h-full">
          <span className="text-gray-400 font-bold text-xs uppercase tracking-wider block mb-2">Notas de Evolución</span>
          <textarea
            value={notaActual}
            disabled={!dienteSeleccionado}
            onChange={(e) => handleNotasChange(e.target.value)}
            placeholder={dienteSeleccionado ? "Escribe las observaciones clínicas..." : "Selecciona un diente para agregar comentarios"}
            className="w-full flex-grow p-3 bg-[#070c16] border border-gray-800 rounded text-xs text-gray-300 focus:outline-none focus:border-cyan-500 resize-none min-h-[100px]"
          />
        </div>
      </div>

      <div className="flex justify-end gap-4 border-t border-slate-800/60 mt-6 pt-4">
        <button 
          onClick={() => { setStrokesActuales([]); handleStrokesChange([]); }} 
          disabled={!dienteSeleccionado}
          className="text-gray-400 hover:text-red-400 font-semibold text-xs transition-colors"
        >
          Limpiar Lienzo Activo
        </button>
        <button
          onClick={handleConfirmarCambios}
          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-md"
        >
          Guardar Historial Clínico
        </button>
        <button onClick={onClose} className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-3 rounded-xl transition-all">
          Cerrar
        </button>
      </div>
    </div>
  );
};