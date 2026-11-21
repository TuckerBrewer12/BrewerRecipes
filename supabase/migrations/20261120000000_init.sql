create extension if not exists pgcrypto;

create table members (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text not null unique,
  is_admin    boolean not null default false,
  large_text  boolean not null default false,
  created_at  timestamptz not null default now(),
  removed_at  timestamptz
);

create table people (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  member_id   uuid unique references members (id) on delete set null,
  created_at  timestamptz not null default now()
);
create unique index people_name_key on people (lower(name));

create table recipes (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  owner_person_id     uuid references people (id) on delete set null,
  uploader_id         uuid not null references members (id),
  last_edited_by      uuid references members (id),
  based_on_recipe_id  uuid references recipes (id) on delete set null,
  category            text not null default 'Other'
                      check (category in ('Breakfast','Main','Side','Soup','Salad','Dessert','Bread','Drink','Holiday','Other')),
  tags                text[] not null default '{}',
  source              text,
  makes               text,
  prep_time           text,
  cook_time           text,

  search_text         text not null default '',
  search              tsvector generated always as (
                        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
                        setweight(to_tsvector('english', coalesce(search_text, '')), 'B')
                      ) stored,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);
create index recipes_search_idx on recipes using gin (search);
create index recipes_owner_idx on recipes (owner_person_id) where deleted_at is null;
create index recipes_uploader_idx on recipes (uploader_id) where deleted_at is null;

create table ingredients (
  id                uuid primary key default gen_random_uuid(),
  recipe_id         uuid not null references recipes (id) on delete cascade,
  position          int not null,
  section           text,
  quantity          numeric,
  quantity_text     text,
  unit              text,
  name              text not null,
  note              text,
  original_text     text not null,
  linked_recipe_id  uuid references recipes (id) on delete set null
);
create index ingredients_recipe_idx on ingredients (recipe_id, position);

create table steps (
  id         uuid primary key default gen_random_uuid(),
  recipe_id  uuid not null references recipes (id) on delete cascade,
  position   int not null,
  section    text,
  text       text not null
);
create index steps_recipe_idx on steps (recipe_id, position);

create table step_inputs (
  step_id        uuid not null references steps (id) on delete cascade,
  ingredient_id  uuid references ingredients (id) on delete cascade,
  input_step_id  uuid references steps (id) on delete cascade,
  check ((ingredient_id is null) <> (input_step_id is null))
);
create index step_inputs_step_idx on step_inputs (step_id);

create table recipe_images (
  id          uuid primary key default gen_random_uuid(),
  recipe_id   uuid not null references recipes (id) on delete cascade,
  path        text not null,
  kind        text not null check (kind in ('original', 'photo')),
  position    int not null default 0,
  created_by  uuid references members (id),
  created_at  timestamptz not null default now()
);
create index recipe_images_recipe_idx on recipe_images (recipe_id, kind, position);

create table posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references members (id),
  caption     text not null default '',
  created_at  timestamptz not null default now(),
  edited_at   timestamptz,
  deleted_at  timestamptz
);
create index posts_created_idx on posts (created_at desc) where deleted_at is null;

create table post_photos (
  id        uuid primary key default gen_random_uuid(),
  post_id   uuid not null references posts (id) on delete cascade,
  path      text not null,
  position  int not null default 0
);
create index post_photos_post_idx on post_photos (post_id, position);

create table post_recipes (
  post_id    uuid not null references posts (id) on delete cascade,
  recipe_id  uuid not null references recipes (id) on delete cascade,
  primary key (post_id, recipe_id)
);
create index post_recipes_recipe_idx on post_recipes (recipe_id);

create table reactions (
  post_id     uuid not null references posts (id) on delete cascade,
  member_id   uuid not null references members (id) on delete cascade,
  emoji       text not null check (emoji in ('❤️', '😋', '👏')),
  created_at  timestamptz not null default now(),
  primary key (post_id, member_id, emoji)
);

create table comments (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references members (id),
  recipe_id   uuid references recipes (id) on delete cascade,
  post_id     uuid references posts (id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now(),
  deleted_at  timestamptz,
  check ((recipe_id is null) <> (post_id is null))
);
create index comments_recipe_idx on comments (recipe_id, created_at) where deleted_at is null;
create index comments_post_idx on comments (post_id, created_at) where deleted_at is null;

create table cook_logs (
  id          uuid primary key default gen_random_uuid(),
  recipe_id   uuid not null references recipes (id) on delete cascade,
  member_id   uuid not null references members (id),
  post_id     uuid references posts (id) on delete set null,
  note        text,
  cooked_on   date not null default current_date,
  created_at  timestamptz not null default now()
);
create index cook_logs_recipe_idx on cook_logs (recipe_id, cooked_on desc);
create index cook_logs_member_idx on cook_logs (member_id, cooked_on desc);

create view recipe_stats as
select
  r.id as recipe_id,
  count(c.id)::int as times_made,
  max(c.cooked_on) as last_made_on
from recipes r
left join cook_logs c on c.recipe_id = r.id
group by r.id;

-- RLS on with no policies: only the server (service role) can read or write.
alter table members        enable row level security;
alter table people         enable row level security;
alter table recipes        enable row level security;
alter table ingredients    enable row level security;
alter table steps          enable row level security;
alter table step_inputs    enable row level security;
alter table recipe_images  enable row level security;
alter table posts          enable row level security;
alter table post_photos    enable row level security;
alter table post_recipes   enable row level security;
alter table reactions      enable row level security;
alter table comments       enable row level security;
alter table cook_logs      enable row level security;
alter view recipe_stats set (security_invoker = true);

insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;
