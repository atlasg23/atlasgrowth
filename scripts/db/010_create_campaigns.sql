-- Create campaigns table
create table if not exists campaigns (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    experiment_id text unique not null,
    niche text not null,
    offer text not null,
    cta_variant text not null,
    message_template text not null,
    status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'complete')),
    sending_schedule text not null default 'manual' check (sending_schedule in ('manual', 'automated')),
    trickle_interval_seconds integer default null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create campaign_contacts junction table
create table if not exists campaign_contacts (
    id uuid primary key default gen_random_uuid(),
    campaign_id uuid not null references campaigns(id) on delete cascade,
    business_id uuid not null references biz(id) on delete cascade,
    contacted_at timestamp with time zone default null,
    viewed_at timestamp with time zone default null,
    engaged_at timestamp with time zone default null,
    hot_lead_at timestamp with time zone default null,
    closed_at timestamp with time zone default null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(campaign_id, business_id)
);

-- Create messages table to track all outbound messages
create table if not exists messages_new (
    id uuid primary key default gen_random_uuid(),
    campaign_id uuid references campaigns(id) on delete set null,
    business_id uuid not null references biz(id) on delete cascade,
    phone_number text not null,
    message_content text not null,
    sent_at timestamp with time zone default timezone('utc'::text, now()) not null,
    delivery_status text default 'sent' check (delivery_status in ('sent', 'delivered', 'failed')),
    response_received boolean default false,
    response_content text default null,
    response_at timestamp with time zone default null
);

-- Add RLS policies
alter table campaigns enable row level security;
alter table campaign_contacts enable row level security;
alter table messages_new enable row level security;

-- Allow all operations for now (you can restrict later)
create policy "Allow all campaigns operations" on campaigns for all using (true);
create policy "Allow all campaign_contacts operations" on campaign_contacts for all using (true);
create policy "Allow all messages_new operations" on messages_new for all using (true);

-- Add indexes for performance
create index if not exists idx_campaign_contacts_campaign_id on campaign_contacts(campaign_id);
create index if not exists idx_campaign_contacts_business_id on campaign_contacts(business_id);
create index if not exists idx_messages_new_campaign_id on messages_new(campaign_id);
create index if not exists idx_messages_new_business_id on messages_new(business_id);
create index if not exists idx_messages_new_sent_at on messages_new(sent_at);