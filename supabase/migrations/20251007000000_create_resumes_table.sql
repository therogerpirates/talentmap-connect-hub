-- Create resumes table to store complete resume data
create table if not exists public.resumes (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.students(id) on delete cascade not null,
  title text not null default 'My Resume',
  resume_data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.resumes enable row level security;

-- Create policies
create policy "Users can view own resumes"
  on public.resumes for select
  using (auth.uid() = student_id);

create policy "Users can create own resumes"
  on public.resumes for insert
  with check (auth.uid() = student_id);

create policy "Users can update own resumes"
  on public.resumes for update
  using (auth.uid() = student_id);

create policy "Users can delete own resumes"
  on public.resumes for delete
  using (auth.uid() = student_id);

-- Add index for faster lookups
create index if not exists resumes_student_id_idx on public.resumes(student_id);

-- Add updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger resumes_updated_at
  before update on public.resumes
  for each row
  execute function public.handle_updated_at();

-- Add phone, linkedin, github to students table if they don't exist
alter table public.students
add column if not exists phone text,
add column if not exists linkedin_url text,
add column if not exists github_url text,
add column if not exists address text;
