-- HackMate Initial Schema Migration
-- Defines normalised tables, foreign keys, constraints, indexes, and Row Level Security (RLS) policies

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    age INT,
    country TEXT NOT NULL,
    state TEXT,
    qualification TEXT NOT NULL,
    college_or_university TEXT,
    degree_and_branch TEXT,
    current_year_of_study INT,
    graduation_year INT,
    status TEXT NOT NULL DEFAULT 'Student',
    is_onboarded BOOLEAN NOT NULL DEFAULT FALSE,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. User Skills Table
CREATE TABLE IF NOT EXISTS public.user_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- 'programming_languages', 'frameworks', 'ai_ml', 'web_dev', etc.
    skill_name TEXT NOT NULL,
    proficiency_level TEXT DEFAULT 'Intermediate',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, category, skill_name)
);

-- 3. User Interests Table
CREATE TABLE IF NOT EXISTS public.user_interests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    interest_tag TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, interest_tag)
);

-- 4. User Preferences Table
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    participation_type TEXT NOT NULL DEFAULT 'Both', -- 'Individual', 'Team', 'Both'
    willingness_to_find_teammates BOOLEAN NOT NULL DEFAULT TRUE,
    preferred_formats JSONB NOT NULL DEFAULT '["Online", "Hybrid"]'::jsonb,
    preferred_locations JSONB NOT NULL DEFAULT '[]'::jsonb,
    willingness_to_travel BOOLEAN NOT NULL DEFAULT FALSE,
    max_registration_fee NUMERIC NOT NULL DEFAULT 0, -- in USD
    preferred_duration_days INT DEFAULT 2,
    receive_deadline_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    receive_new_match_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Opportunity Sources Table
CREATE TABLE IF NOT EXISTS public.opportunity_sources (
    id TEXT PRIMARY KEY, -- 'unstop', 'devfolio', 'devpost', etc.
    name TEXT NOT NULL,
    base_url TEXT NOT NULL,
    adapter_status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'PAUSED', 'PENDING_INTEGRATION'
    last_sync_at TIMESTAMPTZ,
    sync_interval_hours INT DEFAULT 6,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Opportunities Table
CREATE TABLE IF NOT EXISTS public.opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_platform TEXT NOT NULL,
    title TEXT NOT NULL,
    organizer TEXT NOT NULL,
    description TEXT NOT NULL,
    themes JSONB NOT NULL DEFAULT '[]'::jsonb,
    categories JSONB NOT NULL DEFAULT '[]'::jsonb,
    registration_start_date TIMESTAMPTZ NOT NULL,
    registration_deadline TIMESTAMPTZ NOT NULL,
    event_start_date TIMESTAMPTZ NOT NULL,
    event_end_date TIMESTAMPTZ NOT NULL,
    country TEXT NOT NULL DEFAULT 'Global',
    venue TEXT,
    format TEXT NOT NULL DEFAULT 'Online', -- 'Online', 'Offline', 'Hybrid'
    registration_fee NUMERIC NOT NULL DEFAULT 0,
    fee_currency TEXT NOT NULL DEFAULT 'USD',
    prize_pool TEXT DEFAULT 'Free Participation',
    internship_opportunities BOOLEAN NOT NULL DEFAULT FALSE,
    placement_opportunities BOOLEAN NOT NULL DEFAULT FALSE,
    required_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    experience_requirements TEXT,
    application_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
    official_registration_url TEXT NOT NULL,
    original_source_url TEXT NOT NULL,
    last_verified_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    is_verified BOOLEAN NOT NULL DEFAULT TRUE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'upcoming', 'expired', 'withdrawn')),
    duplicate_of_id UUID REFERENCES public.opportunities(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Eligibility Criteria Table
CREATE TABLE IF NOT EXISTS public.eligibility_criteria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id UUID NOT NULL UNIQUE REFERENCES public.opportunities(id) ON DELETE CASCADE,
    min_age INT,
    max_age INT,
    eligible_countries JSONB NOT NULL DEFAULT '["Global"]'::jsonb,
    eligible_qualifications JSONB NOT NULL DEFAULT '[]'::jsonb,
    eligible_academic_years JSONB NOT NULL DEFAULT '[]'::jsonb,
    allowed_statuses JSONB NOT NULL DEFAULT '["Student", "Working Professional"]'::jsonb,
    participation_type TEXT NOT NULL DEFAULT 'Both', -- 'Individual', 'Team', 'Both'
    min_team_size INT DEFAULT 1,
    max_team_size INT DEFAULT 4,
    prerequisites JSONB NOT NULL DEFAULT '[]'::jsonb,
    mandatory_experience JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Opportunity Matches Table
CREATE TABLE IF NOT EXISTS public.opportunity_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('ELIGIBLE', 'POTENTIALLY ELIGIBLE', 'NEEDS ACTION', 'NOT ELIGIBLE')),
    score INT NOT NULL CHECK (score >= 0 AND score <= 100),
    reasons_for_matching JSONB NOT NULL DEFAULT '[]'::jsonb,
    satisfied_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
    missing_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
    potential_blockers JSONB NOT NULL DEFAULT '[]'::jsonb,
    action_required_notice TEXT,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, opportunity_id)
);

-- 9. Saved Opportunities Table
CREATE TABLE IF NOT EXISTS public.saved_opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, opportunity_id)
);

-- 10. Applications Table
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    stage TEXT NOT NULL DEFAULT 'Interested' CHECK (stage IN (
        'Interested', 'Saved', 'Application started', 'Applied', 'Accepted', 'Rejected', 'Participating', 'Completed'
    )),
    notes TEXT,
    team_name TEXT,
    submission_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, opportunity_id)
);

-- 11. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('DEADLINE_APPROACHING', 'NEW_MATCH', 'EVENT_UPDATE', 'APPLICATION_STATUS')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 12. Ingestion Logs Table
CREATE TABLE IF NOT EXISTS public.ingestion_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('SUCCESS', 'WARNING', 'ERROR')),
    items_fetched INT NOT NULL DEFAULT 0,
    items_added INT NOT NULL DEFAULT 0,
    items_updated INT NOT NULL DEFAULT 0,
    items_duplicate INT NOT NULL DEFAULT 0,
    errors JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 13. Admin Reviews Table
CREATE TABLE IF NOT EXISTS public.admin_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    reason TEXT NOT NULL CHECK (reason IN ('UNCERTAIN_ELIGIBILITY', 'SUSPICIOUS_DATES', 'POTENTIAL_DUPLICATE', 'MANUAL_IMPORT')),
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    resolved_at TIMESTAMPTZ
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_opportunities_deadline ON public.opportunities(registration_deadline);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON public.opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_source ON public.opportunities(source_platform);
CREATE INDEX IF NOT EXISTS idx_opportunity_matches_user_cat ON public.opportunity_matches(user_id, category);
CREATE INDEX IF NOT EXISTS idx_applications_user_stage ON public.applications(user_id, stage);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);

-- Enable Row Level Security (RLS) on all user-scoped tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Public tables with read access for authenticated users, admin-only write
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eligibility_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles: Users can view and update their own profile; admins can view all
CREATE POLICY "Users can manage own profile" ON public.profiles
    FOR ALL USING (auth.uid() = id);

-- User Skills & Interests & Preferences
CREATE POLICY "Users can manage own skills" ON public.user_skills
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own interests" ON public.user_interests
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own preferences" ON public.user_preferences
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own matches" ON public.opportunity_matches
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own saved" ON public.saved_opportunities
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own applications" ON public.applications
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR ALL USING (auth.uid() = user_id);

-- Opportunities: All users can view active opportunities
CREATE POLICY "Anyone can view active opportunities" ON public.opportunities
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view eligibility criteria" ON public.eligibility_criteria
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view opportunity sources" ON public.opportunity_sources
    FOR SELECT USING (true);
