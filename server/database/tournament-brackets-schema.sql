-- Tournament Brackets Schema
-- Stores historical tournament data from thetower.lol for bracket difficulty analysis

-- Main tournament brackets table
CREATE TABLE IF NOT EXISTS tournament_brackets (
    id BIGSERIAL PRIMARY KEY,

    -- Tournament info
    tournament_date TIMESTAMPTZ NOT NULL,
    league VARCHAR(20) NOT NULL, -- 'legend', 'champion', 'platinum', 'gold', 'silver', 'copper'
    bracket_id VARCHAR(50) NOT NULL,

    -- Player info
    player_id VARCHAR(50) NOT NULL,
    player_name VARCHAR(100),
    real_name VARCHAR(100),

    -- Performance data
    wave INTEGER NOT NULL,
    rank INTEGER NOT NULL, -- Position in bracket (1-30)
    relic VARCHAR(100), -- Relic used

    -- Bracket stats (denormalized for faster queries)
    bracket_median_wave INTEGER,
    bracket_total_waves INTEGER,

    -- Metadata
    scraped_at TIMESTAMPTZ DEFAULT NOW(),

    -- Indexes
    CONSTRAINT unique_tournament_player UNIQUE (tournament_date, league, player_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_tournament_brackets_date ON tournament_brackets(tournament_date DESC);
CREATE INDEX IF NOT EXISTS idx_tournament_brackets_league ON tournament_brackets(league);
CREATE INDEX IF NOT EXISTS idx_tournament_brackets_player ON tournament_brackets(player_id);
CREATE INDEX IF NOT EXISTS idx_tournament_brackets_bracket ON tournament_brackets(bracket_id);
CREATE INDEX IF NOT EXISTS idx_tournament_brackets_league_date ON tournament_brackets(league, tournament_date DESC);

-- Tournament metadata table (optional - for tracking scraping history)
CREATE TABLE IF NOT EXISTS tournament_metadata (
    id BIGSERIAL PRIMARY KEY,
    tournament_date TIMESTAMPTZ NOT NULL,
    league VARCHAR(20) NOT NULL,
    total_brackets INTEGER,
    total_players INTEGER,
    scrape_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
    scrape_started_at TIMESTAMPTZ,
    scrape_completed_at TIMESTAMPTZ,
    error_message TEXT,

    CONSTRAINT unique_tournament_metadata UNIQUE (tournament_date, league)
);

CREATE INDEX IF NOT EXISTS idx_tournament_metadata_date ON tournament_metadata(tournament_date DESC);
CREATE INDEX IF NOT EXISTS idx_tournament_metadata_league ON tournament_metadata(league);

-- Bracket difficulty analysis results (paired with tower_runs)
CREATE TABLE IF NOT EXISTS bracket_difficulty_analysis (
    id BIGSERIAL PRIMARY KEY,

    -- Link to user and their run
    discord_user_id VARCHAR(100) NOT NULL,
    run_id BIGINT, -- References tower_runs.id

    -- Tournament info
    league VARCHAR(20) NOT NULL,
    wave INTEGER NOT NULL,

    -- Difficulty analysis results
    difficulty_score DECIMAL(5,2), -- 0-100 score
    difficulty_label VARCHAR(20), -- 'Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard'
    actual_rank INTEGER,
    best_possible_rank INTEGER,
    worst_possible_rank INTEGER,
    average_rank DECIMAL(5,2),
    total_brackets_analyzed INTEGER,
    percentile_vs_winners DECIMAL(5,2),

    -- Metadata
    analyzed_at TIMESTAMPTZ DEFAULT NOW(),

    -- Indexes
    CONSTRAINT unique_run_analysis UNIQUE (run_id)
);

CREATE INDEX IF NOT EXISTS idx_bracket_analysis_user ON bracket_difficulty_analysis(discord_user_id);
CREATE INDEX IF NOT EXISTS idx_bracket_analysis_run ON bracket_difficulty_analysis(run_id);
CREATE INDEX IF NOT EXISTS idx_bracket_analysis_difficulty ON bracket_difficulty_analysis(difficulty_score);
CREATE INDEX IF NOT EXISTS idx_bracket_analysis_date ON bracket_difficulty_analysis(analyzed_at DESC);

-- Comments for documentation
COMMENT ON TABLE tournament_brackets IS 'Historical tournament bracket data from thetower.lol for difficulty analysis';
COMMENT ON COLUMN tournament_brackets.tournament_date IS 'Tournament start date (tournaments run every 3-4 days)';
COMMENT ON COLUMN tournament_brackets.league IS 'Player league (legend, champion, platinum, gold, silver, copper)';
COMMENT ON COLUMN tournament_brackets.bracket_id IS 'Unique bracket identifier from thetower.lol';
COMMENT ON COLUMN tournament_brackets.player_id IS 'Player unique ID (e.g., 188EAC641A3EBC7A)';
COMMENT ON COLUMN tournament_brackets.wave IS 'Highest wave reached in tournament';
COMMENT ON COLUMN tournament_brackets.rank IS 'Final ranking in bracket (1-30)';
COMMENT ON COLUMN tournament_brackets.bracket_median_wave IS 'Median wave for all players in this bracket';
COMMENT ON COLUMN tournament_brackets.bracket_total_waves IS 'Sum of all waves in this bracket (difficulty indicator)';

COMMENT ON TABLE bracket_difficulty_analysis IS 'Bracket difficulty analysis results paired with player runs';
COMMENT ON COLUMN bracket_difficulty_analysis.discord_user_id IS 'Discord user ID from tower_runs';
COMMENT ON COLUMN bracket_difficulty_analysis.run_id IS 'Foreign key to tower_runs table';
COMMENT ON COLUMN bracket_difficulty_analysis.difficulty_score IS 'Bracket difficulty score (0=hardest, 100=easiest)';
COMMENT ON COLUMN bracket_difficulty_analysis.difficulty_label IS 'Human-readable difficulty label';
COMMENT ON COLUMN bracket_difficulty_analysis.actual_rank IS 'Player''s actual rank in their bracket';
COMMENT ON COLUMN bracket_difficulty_analysis.percentile_vs_winners IS 'Percentile ranking vs all bracket winners';
