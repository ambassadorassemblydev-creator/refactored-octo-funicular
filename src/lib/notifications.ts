import { supabase } from './supabase';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface CreateNotificationParams {
  user_id: string;
  title: string;
  message: string;
  type?: NotificationType;
  metadata?: any;
}

export const notificationRepo = {
  /**
   * Create a notification for a specific user
   */
  create: async (params: CreateNotificationParams) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert([{
          user_id: params.user_id,
          title: params.title,
          message: params.message,
          type: params.type || 'info',
          metadata: params.metadata,
          is_read: false
        }]);

      if (error) {
        console.error('[NotificationRepo] Error creating notification:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[NotificationRepo] Unexpected error:', err);
      return false;
    }
  },

  /**
   * Notify all admins about an event
   */
  notifyAdmins: async (title: string, message: string, metadata?: any) => {
    try {
      // 1. Get all admin user IDs
      const { data: admins, error: adminError } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role_id', [
          // We need the role IDs or names. Names are safer if we join.
          'admin', 'super_admin', 'pastor'
        ]);
      
      // Wait, user_roles usually has role_id. 
      // Let's use a query that joins with roles.
      const { data: adminUsers, error } = await supabase
        .rpc('get_admin_user_ids'); // If we have an RPC, or just query:

      // Since I don't know the exact schema of user_roles/roles join off-hand, 
      // let's do a robust query.
      const { data: adminRoles } = await supabase.from('roles').select('id').in('name', ['admin', 'super_admin', 'pastor']);
      const roleIds = adminRoles?.map(r => r.id) || [];
      
      if (roleIds.length === 0) return false;

      const { data: userRoles } = await supabase.from('user_roles').select('user_id').in('role_id', roleIds);
      const userIds = Array.from(new Set(userRoles?.map(ur => ur.user_id) || []));

      if (userIds.length === 0) return false;

      // 2. Create notifications for all admins
      const notifications = userIds.map(uid => ({
        user_id: uid,
        title,
        message,
        type: 'info',
        metadata,
        is_read: false
      }));

      const { error: insertError } = await supabase.from('notifications').insert(notifications);
      
      if (insertError) {
        console.error('[NotificationRepo] Error bulk creating notifications:', insertError);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[NotificationRepo] Unexpected error in notifyAdmins:', err);
      return false;
    }
  }
};
