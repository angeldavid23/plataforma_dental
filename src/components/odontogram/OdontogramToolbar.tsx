import React from 'react';
import { Pen, Eraser, Palette } from 'lucide-react';

interface OdontogramaToolbarProps {
  tool: 'pen' | 'eraser';
  setTool: (tool: 'pen' | 'eraser') => void;
  strokeColor: string;
  setStrokeColor: (color: string) => void;
}

// Colores clínicos estándar para registrar hallazgos (Rojo, Azul, Verde, Amarillo)
const COLORES_PREDEFINIDOS = [
  { hex: '#EF4444', label: 'Rojo (Patología)' },
  { hex: '#3B82F6', label: 'Azul (Tratado)' },
  { hex: '#10B981', label: 'Verde (Planificado)' },
  { hex: '#F59E0B', label: 'Amarillo (Alerta)' },
];

export const OdontogramaToolbar: React.FC<OdontogramaToolbarProps> = ({
  tool,
  setTool,
  strokeColor,
  setStrokeColor,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-4 bg-slate-900 p-1.5 rounded-xl border border-slate-800/80">
      
      {/* Grupo 1: Selector de Herramientas (Lápiz y Borrador) */}
      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
        <button
          type="button"
          onClick={() => setTool('pen')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-black transition-all ${
            tool === 'pen'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/10 scale-[1.02]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
          title="Herramienta Lápiz"
        >
          <Pen className="w-3.5 h-3.5" />
          <span>LÁPIZ</span>
        </button>

        <button
          type="button"
          onClick={() => setTool('eraser')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-black transition-all ${
            tool === 'eraser'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/10 scale-[1.02]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
          title="Herramienta Borrador"
        >
          <Eraser className="w-3.5 h-3.5" />
          <span>BORRADOR</span>
        </button>
      </div>

      {/* Divisor Visual */}
      <div className="hidden sm:block h-6 border-r border-slate-800" />

      {/* Grupo 2: Selector de Color Predictivo (Oculto si el borrador está activo) */}
      {tool === 'pen' && (
        <div className="flex items-center gap-3 animate-fadeIn">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {COLORES_PREDEFINIDOS.map((color) => {
              const isSelected = strokeColor === color.hex;
              return (
                <button
                  key={color.hex}
                  type="button"
                  onClick={() => setStrokeColor(color.hex)}
                  className={`w-6 h-6 rounded-md transition-all relative flex items-center justify-center border ${
                    isSelected 
                      ? 'border-white scale-110 ring-2 ring-cyan-500/30' 
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.label}
                >
                  {isSelected && (
                    <div className="w-1.5 h-1.5 bg-slate-950 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Selector de color personalizado avanzado (Input tipo color nativo) */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
            <Palette className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              className="w-5 h-5 bg-transparent border-0 cursor-pointer rounded"
              title="Color personalizado"
            />
          </div>
        </div>
      )}
      
      {/* Estado informativo si está usando el borrador */}
      {tool === 'eraser' && (
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider animate-fadeIn">
          Borrando trazos sobre el lienzo...
        </span>
      )}
    </div>
  );
};