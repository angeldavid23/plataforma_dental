import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { PlusCircle } from 'lucide-react';

export const NuevoPaciente = ({ onCreated }: { onCreated: () => void }) => {
  const [nombre, setNombre] = useState('');
  const [tel, setTel] = useState('');
  const [servicio, setServicio] = useState('');
  const [costo, setCosto] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Insertar el paciente
    const { data: paciente, error: pError } = await supabase
      .from('pacientes')
      .insert([{ nombre_completo: nombre, telefono: tel }])
      .select()
      .single();

    if (pError) return alert(pError.message);

    // 2. Insertar su primer tratamiento (con el saldo inicial igual al costo)
    const { error: tError } = await supabase
      .from('tratamientos')
      .insert([{ 
        paciente_id: paciente.id, 
        nombre_servicio: servicio, 
        costo_total: parseFloat(costo),
        saldo_pendiente: parseFloat(costo) 
      }]);

    if (tError) alert(tError.message);
    else {
      setNombre(''); setTel(''); setServicio(''); setCosto('');
      onCreated(); // Refresca la lista en App.tsx
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border mb-8 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1">NOMBRE</label>
        <input value={nombre} onChange={e => setNombre(e.target.value)} className="w-full border p-2 rounded-lg" required />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1">TELÉFONO (502...)</label>
        <input value={tel} onChange={e => setTel(e.target.value)} className="w-full border p-2 rounded-lg" required />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1">TRATAMIENTO</label>
        <input value={servicio} onChange={e => setServicio(e.target.value)} className="w-full border p-2 rounded-lg" required />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1">COSTO TOTAL</label>
        <input type="number" value={costo} onChange={e => setCosto(e.target.value)} className="w-full border p-2 rounded-lg" required />
      </div>
      <button type="submit" className="bg-slate-900 text-white p-2 rounded-lg font-bold flex justify-center gap-2 hover:bg-blue-600 transition-colors">
        <PlusCircle size={20} /> Crear
      </button>
    </form>
  );
}