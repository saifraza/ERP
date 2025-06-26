-- Disable foreign key checks
SET session_replication_role = 'replica';

-- Truncate all tables in public schema
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'TRUNCATE TABLE "' || r.tablename || '" CASCADE';
    END LOOP;
END $$;

-- Re-enable foreign key checks
SET session_replication_role = 'origin';

-- Reset sequences (auto-increment counters)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT c.relname FROM pg_class c WHERE c.relkind = 'S')
    LOOP
        EXECUTE 'ALTER SEQUENCE "' || r.relname || '" RESTART WITH 1';
    END LOOP;
END $$;
EOF < /dev/null