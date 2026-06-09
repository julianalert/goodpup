-- =====================
-- BREEDS
-- =====================
create table breeds (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  group_name text,
  weight_range text,
  height_range text,
  lifespan text,
  origin text,
  purpose text,
  emoji text,
  description text,
  tags text[],

  -- scores (0–100)
  score_overall integer,
  score_trainability integer,
  score_energy integer,
  score_beginner_friendly integer,
  score_sociability integer,
  score_independence integer,

  -- temperament scores (0–100)
  trait_affectionate integer,
  trait_playfulness integer,
  trait_patience integer,
  trait_prey_drive integer,
  trait_guarding_instinct integer,

  -- training drives (0–100)
  drive_food integer,
  drive_praise integer,
  drive_play integer,
  drive_focus_outdoors integer,
  drive_distraction_threshold integer,

  -- daily life
  daily_exercise_minutes integer,
  max_alone_hours integer,
  apartment_suitable boolean,
  apartment_note text,
  good_with_kids text,
  good_with_dogs text,
  good_with_cats text,

  -- training notes
  training_overview text,
  adolescence_warning text,

  -- seo
  meta_title text,
  meta_description text,

  created_at timestamptz default now()
);

-- =====================
-- PROBLEMS
-- =====================
create table problems (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  emoji text,
  description text,
  root_cause text,
  avg_difficulty integer,
  avg_timeline_weeks_min integer,
  avg_timeline_weeks_max integer,
  hardest_breeds text[],
  easiest_breeds text[],
  peak_age text,

  -- seo
  meta_title text,
  meta_description text,

  created_at timestamptz default now()
);

-- =====================
-- BREED × PROBLEM
-- =====================
create table breed_problems (
  id uuid primary key default gen_random_uuid(),
  breed_id uuid references breeds(id) on delete cascade,
  problem_id uuid references problems(id) on delete cascade,
  unique(breed_id, problem_id),

  frequency text check (frequency in ('very-common', 'common', 'occasional', 'rare')),
  difficulty integer check (difficulty between 0 and 10),
  timeline_weeks_min integer,
  timeline_weeks_max integer,

  why_this_breed text,
  makes_it_worse text,
  what_fix_requires text[],
  common_mistakes jsonb,
  age_risk_note text,

  -- seo
  meta_title text,
  meta_description text,

  created_at timestamptz default now()
);

-- =====================
-- ROW LEVEL SECURITY
-- =====================
alter table breeds enable row level security;
alter table problems enable row level security;
alter table breed_problems enable row level security;

-- Public read-only (SEO pages, no user data)
create policy "public can read breeds"
  on breeds for select using (true);

create policy "public can read problems"
  on problems for select using (true);

create policy "public can read breed_problems"
  on breed_problems for select using (true);

-- =====================
-- INDEXES
-- =====================
create index idx_breeds_slug on breeds(slug);
create index idx_problems_slug on problems(slug);
create index idx_breed_problems_breed on breed_problems(breed_id);
create index idx_breed_problems_problem on breed_problems(problem_id);

-- =====================
-- HELPER VIEW
-- =====================
create view breed_problem_paths as
  select
    b.slug as breed_slug,
    p.slug as problem_slug,
    bp.*
  from breed_problems bp
  join breeds b on b.id = bp.breed_id
  join problems p on p.id = bp.problem_id;
