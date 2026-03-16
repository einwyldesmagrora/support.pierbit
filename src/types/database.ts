export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'user' | 'supporter' | 'projektinhaber' | 'admin';

export type TicketStatus = 'open' | 'in_progress' | 'closed';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          avatar_url: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string;
          avatar_url?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          avatar_url?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
      };
      ticket_categories: {
        Row: {
          id: string;
          name: string;
          description: string;
          required_role: UserRole;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          required_role?: UserRole;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          required_role?: UserRole;
          color?: string;
          created_at?: string;
        };
      };
      tickets: {
        Row: {
          id: string;
          ticket_number: string;
          title: string;
          description: string;
          status: TicketStatus;
          priority: TicketPriority;
          category_id: string;
          created_by: string;
          assigned_to: string | null;
          created_at: string;
          updated_at: string;
          closed_at: string | null;
        };
        Insert: {
          id?: string;
          ticket_number?: string;
          title: string;
          description: string;
          status?: TicketStatus;
          priority?: TicketPriority;
          category_id: string;
          created_by: string;
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
          closed_at?: string | null;
        };
        Update: {
          id?: string;
          ticket_number?: string;
          title?: string;
          description?: string;
          status?: TicketStatus;
          priority?: TicketPriority;
          category_id?: string;
          created_by?: string;
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
          closed_at?: string | null;
        };
      };
      ticket_comments: {
        Row: {
          id: string;
          ticket_id: string;
          user_id: string;
          content: string;
          is_internal: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          user_id: string;
          content: string;
          is_internal?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ticket_id?: string;
          user_id?: string;
          content?: string;
          is_internal?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      ticket_attachments: {
        Row: {
          id: string;
          ticket_id: string;
          comment_id: string | null;
          user_id: string;
          file_name: string;
          file_path: string;
          file_size: number;
          mime_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          comment_id?: string | null;
          user_id: string;
          file_name: string;
          file_path: string;
          file_size: number;
          mime_type: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          ticket_id?: string;
          comment_id?: string | null;
          user_id?: string;
          file_name?: string;
          file_path?: string;
          file_size?: number;
          mime_type?: string;
          created_at?: string;
        };
      };
      pterodactyl_accounts: {
        Row: {
          id: string;
          user_id: string;
          pterodactyl_id: number | null;
          pterodactyl_uuid: string | null;
          username: string;
          created_at: string;
          synced_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          pterodactyl_id?: number | null;
          pterodactyl_uuid?: string | null;
          username: string;
          created_at?: string;
          synced_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          pterodactyl_id?: number | null;
          pterodactyl_uuid?: string | null;
          username?: string;
          created_at?: string;
          synced_at?: string;
        };
      };
      ticket_assignments: {
        Row: {
          id: string;
          ticket_id: string;
          assigned_to: string;
          assigned_by: string;
          assigned_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          assigned_to: string;
          assigned_by: string;
          assigned_at?: string;
        };
        Update: {
          id?: string;
          ticket_id?: string;
          assigned_to?: string;
          assigned_by?: string;
          assigned_at?: string;
        };
      };
    };
  };
}
