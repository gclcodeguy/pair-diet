import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hqpuhpnfaeudwiqimhwm.supabase.co';
const supabaseAnonKey = 'YOUR_ANON_KEY'; // You'll need to add your anon key here

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
