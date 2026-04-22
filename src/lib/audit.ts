import { supabase } from './supabase';

export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'PERMISSION_CHANGE';

export interface AuditLogEntry {
  admin_id: string;
  action: AuditAction;
  table_name: string;
  record_id?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
}

export const auditRepo = {
  /**
   * Log an administrative action to the database
   */
  logAction: async (entry: AuditLogEntry) => {
    try {
      const { error } = await supabase
        .from('audit_log')
        .insert([{
          admin_id: entry.admin_id,
          action: entry.action,
          table_name: entry.table_name,
          record_id: entry.record_id,
          old_data: entry.old_values, // Matching the DB column name
          new_data: entry.new_values, // Matching the DB column name
          ip_address: entry.ip_address,
          user_agent: entry.user_agent
        }]);

      if (error) {
        console.error('[AuditRepo] Failed to log action:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[AuditRepo] Unexpected error during logging:', err);
      return false;
    }
  },

  /**
   * Fetch recent audit logs (Admin only)
   */
  getRecentLogs: async (limit = 50) => {
    const { data, error } = await supabase
      .from('audit_log')
      .select(`
        *,
        admin:admin_id (
          first_name,
          last_name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }
};
