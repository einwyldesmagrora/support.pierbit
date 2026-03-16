/*
  # Create Core Support Platform Schema

  ## Overview
  This migration sets up the complete database schema for the Pierbit Hosting support platform,
  including user profiles, roles, ticket management, and Pterodactyl integration.

  ## New Tables

  ### `profiles`
  Extends auth.users with additional user information
  - `id` (uuid, FK to auth.users)
  - `email` (text)
  - `full_name` (text)
  - `avatar_url` (text, nullable)
  - `role` (text, default 'user')
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `ticket_categories`
  Defines ticket categories with required role levels
  - `id` (uuid, PK)
  - `name` (text)
  - `description` (text)
  - `required_role` (text, minimum role needed to access)
  - `color` (text, hex color for UI)
  - `created_at` (timestamptz)

  ### `tickets`
  Main ticket table
  - `id` (uuid, PK)
  - `ticket_number` (text, unique identifier)
  - `title` (text)
  - `description` (text)
  - `status` (text: open/in_progress/closed)
  - `priority` (text: low/medium/high/urgent)
  - `category_id` (uuid, FK to ticket_categories)
  - `created_by` (uuid, FK to auth.users)
  - `assigned_to` (uuid, FK to auth.users, nullable)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  - `closed_at` (timestamptz, nullable)

  ### `ticket_comments`
  Comments and threads within tickets
  - `id` (uuid, PK)
  - `ticket_id` (uuid, FK to tickets)
  - `user_id` (uuid, FK to auth.users)
  - `content` (text)
  - `is_internal` (boolean, staff-only notes)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `ticket_attachments`
  File attachments for tickets
  - `id` (uuid, PK)
  - `ticket_id` (uuid, FK to tickets)
  - `comment_id` (uuid, FK to ticket_comments, nullable)
  - `user_id` (uuid, FK to auth.users)
  - `file_name` (text)
  - `file_path` (text, Supabase Storage path)
  - `file_size` (bigint)
  - `mime_type` (text)
  - `created_at` (timestamptz)

  ### `pterodactyl_accounts`
  Links users to Pterodactyl panel accounts
  - `id` (uuid, PK)
  - `user_id` (uuid, FK to auth.users)
  - `pterodactyl_id` (integer)
  - `pterodactyl_uuid` (uuid)
  - `username` (text)
  - `created_at` (timestamptz)
  - `synced_at` (timestamptz)

  ### `ticket_assignments`
  Tracks ticket assignment history
  - `id` (uuid, PK)
  - `ticket_id` (uuid, FK to tickets)
  - `assigned_to` (uuid, FK to auth.users)
  - `assigned_by` (uuid, FK to auth.users)
  - `assigned_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Role-based policies for ticket access
  - Users can only view their own tickets unless they have staff role
  - Staff roles can view tickets based on category permissions
  - Admin role has full access to all data

  ## Important Notes
  1. Role hierarchy: user < supporter < projektinhaber < admin
  2. Higher roles inherit permissions from lower roles
  3. Ticket numbers are auto-generated with format: PIERBIT-XXXXXX
  4. Default categories are created for: Support, Technical Support, Applications, Partnerships
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text DEFAULT '',
  avatar_url text,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create ticket_categories table
CREATE TABLE IF NOT EXISTS ticket_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  required_role text NOT NULL DEFAULT 'supporter',
  color text DEFAULT '#6366F1',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ticket_categories ENABLE ROW LEVEL SECURITY;

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'medium',
  category_id uuid REFERENCES ticket_categories(id) ON DELETE RESTRICT,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  closed_at timestamptz
);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Create ticket_comments table
CREATE TABLE IF NOT EXISTS ticket_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_internal boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;

-- Create ticket_attachments table
CREATE TABLE IF NOT EXISTS ticket_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES ticket_comments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;

-- Create pterodactyl_accounts table
CREATE TABLE IF NOT EXISTS pterodactyl_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  pterodactyl_id integer,
  pterodactyl_uuid uuid,
  username text NOT NULL,
  created_at timestamptz DEFAULT now(),
  synced_at timestamptz DEFAULT now()
);

ALTER TABLE pterodactyl_accounts ENABLE ROW LEVEL SECURITY;

-- Create ticket_assignments table
CREATE TABLE IF NOT EXISTS ticket_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now()
);

ALTER TABLE ticket_assignments ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user has required role
CREATE OR REPLACE FUNCTION has_role(user_id uuid, required_role text)
RETURNS boolean AS $$
DECLARE
  user_role text;
  role_hierarchy text[] := ARRAY['user', 'supporter', 'projektinhaber', 'admin'];
  user_level int;
  required_level int;
BEGIN
  SELECT role INTO user_role FROM profiles WHERE id = user_id;
  
  SELECT array_position(role_hierarchy, user_role) INTO user_level;
  SELECT array_position(role_hierarchy, required_role) INTO required_level;
  
  RETURN user_level >= required_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS text AS $$
DECLARE
  next_num int;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 9) AS int)), 0) + 1
  INTO next_num
  FROM tickets;
  
  RETURN 'PIERBIT-' || LPAD(next_num::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket numbers
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS trigger AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ticket_number_trigger
  BEFORE INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_number();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER ticket_comments_updated_at
  BEFORE UPDATE ON ticket_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Insert default ticket categories
INSERT INTO ticket_categories (name, description, required_role, color) VALUES
  ('Support', 'General support inquiries and help requests', 'supporter', '#10B981'),
  ('Technischer Support', 'Technical issues and troubleshooting', 'supporter', '#F59E0B'),
  ('Bewerbung', 'Staff applications and recruitment', 'admin', '#4F46E5'),
  ('Partnerschaften', 'Partnership and collaboration requests', 'admin', '#6366F1')
ON CONFLICT DO NOTHING;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Staff can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'supporter'));

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR auth.uid() = id);

-- RLS Policies for ticket_categories
CREATE POLICY "Anyone can view categories they have access to"
  ON ticket_categories FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), required_role));

CREATE POLICY "Admins can manage categories"
  ON ticket_categories FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for tickets
CREATE POLICY "Users can view own tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Staff can view tickets in accessible categories"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ticket_categories tc
      WHERE tc.id = tickets.category_id
      AND has_role(auth.uid(), tc.required_role)
    )
  );

CREATE POLICY "Users can create tickets"
  ON tickets FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Staff can update assigned tickets"
  ON tickets FOR UPDATE
  TO authenticated
  USING (
    assigned_to = auth.uid() OR
    has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    assigned_to = auth.uid() OR
    has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can update own open tickets"
  ON tickets FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() AND status = 'open')
  WITH CHECK (created_by = auth.uid());

-- RLS Policies for ticket_comments
CREATE POLICY "Users can view comments on accessible tickets"
  ON ticket_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_comments.ticket_id
      AND (
        t.created_by = auth.uid() OR
        t.assigned_to = auth.uid() OR
        EXISTS (
          SELECT 1 FROM ticket_categories tc
          WHERE tc.id = t.category_id
          AND has_role(auth.uid(), tc.required_role)
        )
      )
    )
    AND (is_internal = false OR has_role(auth.uid(), 'supporter'))
  );

CREATE POLICY "Users can create comments on accessible tickets"
  ON ticket_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_comments.ticket_id
      AND (
        t.created_by = auth.uid() OR
        t.assigned_to = auth.uid() OR
        EXISTS (
          SELECT 1 FROM ticket_categories tc
          WHERE tc.id = t.category_id
          AND has_role(auth.uid(), tc.required_role)
        )
      )
    )
  );

CREATE POLICY "Users can update own comments"
  ON ticket_comments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for ticket_attachments
CREATE POLICY "Users can view attachments on accessible tickets"
  ON ticket_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_attachments.ticket_id
      AND (
        t.created_by = auth.uid() OR
        t.assigned_to = auth.uid() OR
        EXISTS (
          SELECT 1 FROM ticket_categories tc
          WHERE tc.id = t.category_id
          AND has_role(auth.uid(), tc.required_role)
        )
      )
    )
  );

CREATE POLICY "Users can upload attachments to accessible tickets"
  ON ticket_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_attachments.ticket_id
      AND (
        t.created_by = auth.uid() OR
        t.assigned_to = auth.uid() OR
        EXISTS (
          SELECT 1 FROM ticket_categories tc
          WHERE tc.id = t.category_id
          AND has_role(auth.uid(), tc.required_role)
        )
      )
    )
  );

-- RLS Policies for pterodactyl_accounts
CREATE POLICY "Users can view own pterodactyl account"
  ON pterodactyl_accounts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Staff can view all pterodactyl accounts"
  ON pterodactyl_accounts FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'supporter'));

CREATE POLICY "System can create pterodactyl accounts"
  ON pterodactyl_accounts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage pterodactyl accounts"
  ON pterodactyl_accounts FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for ticket_assignments
CREATE POLICY "Staff can view assignments"
  ON ticket_assignments FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'supporter'));

CREATE POLICY "Staff can create assignments"
  ON ticket_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'supporter') AND
    assigned_by = auth.uid()
  );

-- Create storage bucket for ticket attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-attachments', 'ticket-attachments', false)
ON CONFLICT DO NOTHING;

-- Storage policies for ticket attachments
CREATE POLICY "Users can upload attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'ticket-attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view accessible attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'ticket-attachments' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      has_role(auth.uid(), 'supporter')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_category_id ON tickets(category_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket_id ON ticket_attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);