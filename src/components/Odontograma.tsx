// components/Odontograma.tsx
import { useState } from 'react';

const DIENTES_SUPERIORES = ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28'];
const DIENTES_INFERIORES = ['48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38'];

export const Odontograma = ({ onChange }: { onChange: (data: any) => void }) => {
  const [seleccionados, setSeleccionados] = useState<Record<string, string>>({});

  const toggleDiente = (numero: string) => {
    const estado = prompt("Estado del diente (Caries, Ausente, Resina, Limpio):", "Caries");
    if (estado) {
      const nuevoEstado = { ...seleccionados, [numero]: estado };
      setSeleccionados(nuevoEstado);
      onChange(nuevoEstado);
    }
  };

  return (
    <div className="bg-slate-50 p-4 rounded-2xl border overflow-x-auto">
      <h3 className="text-sm font-bold text-slate-500 mb-4 text-center">MAPA DENTAL (ODONTOGRAMA)</h3>
      
      {/* Fila Superior */}
      <div className="flex justify-center gap-1 mb-8">
        {DIENTES_SUPERIORES.map(d => (
          <button
            key={d}
            type="button"
            onClick={() => toggleDiente(d)}
            className={`w-8 h-10 border-2 rounded flex flex-col items-center justify-center text-[10px] font-bold transition-colors
              ${seleccionados[d] ? 'bg-red-100 border-red-500 text-red-700' : 'bg-white border-slate-200 text-slate-400 hover:border-blue-400'}`}
          >
            {d}
            <span className="text-[8px] block">{seleccionados[d] ? '●' : ''}</span>
          </button>
        ))}
      </div>

      {/* Fila Inferior */}
      <div className="flex justify-center gap-1">
        {DIENTES_INFERIORES.map(d => (
          <button
            key={d}
            type="button"
            onClick={() => toggleDiente(d)}
            className={`w-8 h-10 border-2 rounded flex flex-col items-center justify-center text-[10px] font-bold transition-colors
              ${seleccionados[d] ? 'bg-red-100 border-red-500 text-red-700' : 'bg-white border-slate-200 text-slate-400 hover:border-blue-400'}`}
          >
            <span className="text-[8px] block">{seleccionados[d] ? '●' : ''}</span>
            {d}
          </button>
        ))}
      </div>
    </div>
  );
};