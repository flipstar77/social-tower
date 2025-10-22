-- Add DELETE policy for tower_runs
-- This allows the service role (backend) to delete runs

CREATE POLICY "Service role can delete tower_runs" ON tower_runs
    FOR DELETE USING (auth.role() = 'service_role');
