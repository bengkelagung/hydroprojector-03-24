import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vtqxdgejqgyhhvnaxnfq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0cXhkZ2VqcWd5aGh2bmF4bmZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyNjMzMzMsImV4cCI6MjA1NzgzOTMzM30.yIqydW7F2KLiA6-OwwMP-AAD-wbAsFyqWPNhvy23G1w'

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 