-- Profiles table (public usernames)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  created_at timestamp with time zone default now()
);

-- User movies
create table if not exists user_movies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  title text not null,
  rank int not null check (rank between 1 and 50),
  created_at timestamp with time zone default now(),
  unique (user_id, rank)
);

-- Row Level Security
alter table profiles enable row level security;
alter table user_movies enable row level security;

-- Policies
create policy "Public profiles readable"
on profiles for select
using (true);

create policy "Users manage own profile"
on profiles for all
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Public lists readable"
on user_movies for select
using (true);

create policy "Users manage own movies"
on user_movies for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);