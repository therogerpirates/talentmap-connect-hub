@echo off
echo Running Supabase migrations...
echo.
echo Please make sure you have Supabase CLI installed and are logged in.
echo.
echo To run the migration manually:
echo 1. Open Supabase Dashboard: https://supabase.com/dashboard
echo 2. Go to your project
echo 3. Navigate to SQL Editor
echo 4. Copy and paste the contents of: supabase/migrations/20251007000000_create_resumes_table.sql
echo 5. Click "Run"
echo.
echo Or if using Supabase CLI locally:
echo supabase db push
echo.
pause
