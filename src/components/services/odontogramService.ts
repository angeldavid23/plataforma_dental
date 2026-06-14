import { createClient } from '@supabase/supabase-js';
import type { Stroke, OdontogramSession } from '../../types/odontogram';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const odontogramService = {
  /**
   * Guarda una sesión completa de odontograma con sus respectivos trazos
   */
  async saveSession(session: OdontogramSession): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // 1. Insertar cabecera del Odontograma
      const { data: odoData, error: odoError } = await supabase
        .from('odontograms')
        .insert([
          {
            patient_id: session.patientId,
            doctor_id: session.doctorId,
            notes: session.notes,
          },
        ])
        .select()
        .single();

      if (odoError) throw odoError;

      // 2. Preparar los trazos vectoriales vinculados al ID generado
      const strokesToInsert = session.strokes.map((stroke) => ({
        odontogram_id: odoData.id,
        tool: stroke.tool,
        stroke_width: stroke.strokeWidth,
        color: stroke.color,
        points: stroke.points, // Postgres guardará esto automáticamente como JSONB
      }));

      // 3. Inserción masiva (Bulk insert)
      const { error: strokesError } = await supabase
        .from('odontogram_strokes')
        .insert(strokesToInsert);

      if (strokesError) throw strokesError;

      return { success: true, data: odoData };
    } catch (error: any) {
      console.error('Error saving odontogram:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Recupera el último odontograma activo de un paciente específico
   */
  async getLatestByPatient(patientId: string): Promise<Stroke[]> {
    try {
      // Obtener el registro más reciente del odontograma
      const { data: odoData, error: odoError } = await supabase
        .from('odontograms')
        .select('id')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (odoError) throw odoError;
      if (!odoData || odoData.length === 0) return [];

      // Obtener todos los trazos ordenados de forma ascendente para replicar el dibujo en orden
      const { data: strokesData, error: strokesError } = await supabase
        .from('odontogram_strokes')
        .select('*')
        .eq('odontogram_id', odoData[0].id)
        .order('created_at', { ascending: true });

      if (strokesError) throw strokesError;

      // Mapear de Snake_case (BD) a CamelCase (Frontend UI)
      return strokesData.map((s: any) => ({
        id: s.id,
        tool: s.tool,
        strokeWidth: s.stroke_width,
        color: s.color,
        points: typeof s.points === 'string' ? JSON.parse(s.points) : s.points,
      }));
    } catch (error) {
      console.error('Error fetching odontogram:', error);
      return [];
    }
  },
};