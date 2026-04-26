import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Banknote, Calendar, History } from 'lucide-react';

export interface Abono {
  id: string;
  tratamiento_id: string;
  monto: number;
  fecha_pago: string;
}

interface Props {
  tratamientoId: string;
  nombrePaciente: string;
  saldoActual: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const ModalAbono: React.FC<Props> = ({ 
  tratamientoId, 
  nombrePaciente, 
  saldoActual, 
  onClose, 
  onSuccess 
}) => {
  const [monto, setMonto] = useState<string>('');
  const [enviando, setEnviando] = useState(false);
  const [historial, setHistorial] = useState<Abono[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(true);

  useEffect(() => {
    const fetchHistorial = async () => {
      const { data, error } = await supabase
        .from('abonos')
        .select('id, tratamiento_id, monto, fecha_pago')
        .eq('tratamiento_id', tratamientoId)
        .order('fecha_pago', { ascending: false });

      if (!error && data) {
        setHistorial(data as unknown as Abono[]);
      }
      setCargandoHistorial(false);
    };
    fetchHistorial();
  }, [tratamientoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valor = parseFloat(monto);
    if (isNaN(valor) || valor <= 0 || valor > saldoActual) {
      alert("Monto inválido");
      return;
    }

    setEnviando(true);
    try {
      const { error } = await supabase
        .from('abonos')
        .insert([{ tratamiento_id: tratamientoId, monto: valor }]);

      if (error) throw error;
      onSuccess();
      onClose();
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl border border-slate-100 flex flex-col md:flex-row gap-8">
        
        {/* Lado Izquierdo: Formulario */}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Nuevo Abono</h2>
              <p className="text-slate-500 text-sm font-medium">{nombrePaciente}</p>
            </div>
          </div>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 mb-6">
            <span className="text-amber-600 font-bold text-xs uppercase tracking-wider block mb-1">Saldo Actual</span>
            <span className="font-black text-amber-700 text-2xl">Q{saldoActual}</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Monto a Recibir (Q)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">Q</span>
                <input
                  autoFocus
                  type="number"
                  step="0.01"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-10 pr-4 text-2xl font-black text-slate-900 focus:border-blue-500 outline-none"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={enviando || !monto}
              className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {enviando ? "Procesando..." : <><Banknote size={20} /> Registrar Pago</>}
            </button>
            
            <button type="button" onClick={onClose} className="w-full text-slate-400 font-bold text-sm">
              Cancelar
            </button>
          </form>
        </div>

        {/* Lado Derecho: Historial */}
        <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8">
          <div className="flex items-center gap-2 mb-6">
            <History className="text-slate-400" size={20} />
            <h3 className="font-black text-slate-800 uppercase text-sm tracking-widest">Historial de Pagos</h3>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {cargandoHistorial ? (
              <p className="text-slate-400 text-sm italic">Cargando...</p>
            ) : historial.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-10 border border-dashed rounded-2xl">Sin pagos</p>
            ) : (
              historial.map((pago) => (
                <div key={pago.id} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl">
                  <div>
                    <p className="text-xs font-bold text-slate-700">
                      {(() => {
                        // FIX FECHA INVÁLIDA: Reemplazamos espacio por T
                        const d = new Date(pago.fecha_pago.replace(" ", "T"));
                        return isNaN(d.getTime()) ? "Fecha error" : d.toLocaleDateString('es-GT', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        });
                      })()}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Abono Recibido</p>
                  </div>
                  <span className="font-black text-slate-900">Q{pago.monto}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};