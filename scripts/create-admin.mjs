import { createClient } from '@supabase/supabase-js';

const url = 'https://ygmixnumaefjbspzitiy.supabase.co';
const anon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnbWl4bnVtYWVmamJzcHppdGl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5MDk1MDMsImV4cCI6MjEwNzQ4NTUwM30.EPPyPYp1dxy_u-p--C2cMTzWTz_eZGKOb4XE0OKFwJo';
const supabase = createClient(url, anon);

async function createAdmin() {
  console.log('Attempting to create admin@flowsites.com...');
  const { data, error } = await supabase.auth.signUp({
    email: 'admin@flowsites.com',
    password: 'disciplinematters',
    options: {
      data: {
        full_name: 'Admin',
        name: 'Admin',
      },
    },
  });

  if (error) {
    console.error('Create admin error:', error);
  } else {
    console.log('SUCCESS! Admin user created:', data.user?.email);
  }
}

createAdmin();
