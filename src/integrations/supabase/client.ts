
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://azgxttbpxelnlemnvenl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6Z3h0dGJweGVsbmxlbW52ZW5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE2OTA5NzAsImV4cCI6MjA1NzI2Njk3MH0.Q5Niw0hZItt4KM-THiCOt9b4g7eDHsH5Wg4PoZ83m8U";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
