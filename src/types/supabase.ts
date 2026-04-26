// src/types/supabase.ts
export interface Paciente {
  id: string;
  nombre_completo: string;
  telefono: string;
  creado_en: string;
}

export interface Tratamiento {
  id: string;
  paciente_id: string;
  nombre_servicio: string;
  costo_total: number;
  saldo_pendiente: number;
  completado: boolean;
}


export interface Abono {
  id: string;
  tratamiento_id: string;
  monto: number;
  fecha_pago: string;
}

export interface Cita {
  id: string;
  paciente_id: string;
  fecha_cita: string;
  motivo: string;
}
