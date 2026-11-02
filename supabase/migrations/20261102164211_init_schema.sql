-- Initial schema, ported from the Replit/Neon database (backup.dump) and
-- reconciled with shared/schema.ts. The dump predates two columns the app
-- already uses (tournaments.food_fee, tournaments.registration_window), so
-- they are created here.

create table public.tournaments (
    id character varying default gen_random_uuid() not null,
    name text not null,
    format text not null,
    date timestamp without time zone not null,
    buy_in integer not null,
    food_fee integer default 0 not null,
    registration_window text default ''::text not null,
    prize_pool integer not null,
    max_seats integer not null,
    registered_count integer default 0 not null,
    rebuy_amount integer not null,
    rebuy_chips integer not null,
    addon_amount integer not null,
    addon_chips integer not null,
    starting_stack integer not null,
    starting_small_blind integer not null,
    starting_big_blind integer not null,
    blind_level_minutes integer not null,
    break_frequency integer not null,
    break_duration_minutes integer not null,
    rebuy_limit text not null,
    rebuy_deadline text not null,
    addon_available text not null,
    late_registration_levels integer not null,
    blind_schedule text not null,
    constraint tournaments_pkey primary key (id)
);

create table public.registrations (
    id character varying default gen_random_uuid() not null,
    tournament_id character varying not null,
    name text not null,
    email text not null,
    phone text not null,
    registration_type text default 'confirmed'::text not null,
    constraint registrations_pkey primary key (id),
    constraint registrations_tournament_id_tournaments_id_fk
        foreign key (tournament_id) references public.tournaments(id) on delete cascade
);

create table public.tournament_results (
    id character varying default gen_random_uuid() not null,
    tournament_id character varying not null,
    player_name text not null,
    placement integer not null,
    prize_amount integer default 0 not null,
    constraint tournament_results_pkey primary key (id),
    constraint tournament_results_tournament_id_tournaments_id_fk
        foreign key (tournament_id) references public.tournaments(id) on delete cascade
);

create table public.notification_subscribers (
    id character varying default gen_random_uuid() not null,
    name text not null,
    email text not null,
    phone text not null,
    constraint notification_subscribers_pkey primary key (id)
);

create table public.admin_users (
    id character varying default gen_random_uuid() not null,
    email text not null,
    password_hash text not null,
    name text not null,
    constraint admin_users_pkey primary key (id),
    constraint admin_users_email_key unique (email)
);

create table public.tournament_rules (
    id character varying default gen_random_uuid() not null,
    sections text not null,
    constraint tournament_rules_pkey primary key (id)
);

create table public.chip_structure (
    id character varying default gen_random_uuid() not null,
    starting_stack integer not null,
    starting_small_blind integer not null,
    starting_big_blind integer not null,
    blind_level_minutes integer not null,
    break_frequency integer default 3 not null,
    break_duration_minutes integer default 15 not null,
    rebuy_amount integer not null,
    rebuy_chips integer not null,
    rebuy_limit text not null,
    rebuy_deadline text not null,
    addon_amount integer not null,
    addon_chips integer not null,
    addon_available text not null,
    late_registration_levels integer not null,
    blind_schedule text not null,
    constraint chip_structure_pkey primary key (id)
);

-- Express session store (connect-pg-simple).
create table public.session (
    sid character varying not null,
    sess json not null,
    expire timestamp(6) without time zone not null,
    constraint session_pkey primary key (sid)
);

create index "IDX_session_expire" on public.session using btree (expire);

-- The Express server connects straight to Postgres as a privileged role, which
-- bypasses RLS. Enabling RLS with no policies means Supabase's auto-generated
-- REST/GraphQL API (anon / authenticated keys) can read or write none of this,
-- including admin password hashes and registrant contact details.
alter table public.tournaments enable row level security;
alter table public.registrations enable row level security;
alter table public.tournament_results enable row level security;
alter table public.notification_subscribers enable row level security;
alter table public.admin_users enable row level security;
alter table public.tournament_rules enable row level security;
alter table public.chip_structure enable row level security;
alter table public.session enable row level security;
