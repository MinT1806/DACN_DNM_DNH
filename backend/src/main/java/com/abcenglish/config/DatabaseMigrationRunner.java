package com.abcenglish.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.Statement;

@Component
public class DatabaseMigrationRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseMigrationRunner.class);

    private final DataSource dataSource;

    public DatabaseMigrationRunner(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @PostConstruct
    public void migrateDatabase() {
        log.info("[DB-MIGRATION] Starting database migration...");

        try (Connection conn = dataSource.getConnection()) {
            conn.setAutoCommit(true);
            DatabaseMetaData metaData = conn.getMetaData();

            migrateTestSessions(metaData, conn);

            log.info("[DB-MIGRATION] Database migration completed successfully");
        } catch (Exception e) {
            log.error("[DB-MIGRATION] Migration failed: {}", e.getMessage(), e);
        }
    }

    private void migrateTestSessions(DatabaseMetaData metaData, Connection conn) throws Exception {
        boolean tableExists = tableExists(metaData, "test_sessions");

        if (!tableExists) {
            log.info("[DB-MIGRATION] Creating test_sessions table...");
            createTestSessionsTable(conn);
            return;
        }

        log.info("[DB-MIGRATION] Running migrations on existing test_sessions table...");

        // Add columns that don't exist
        if (!columnExists(metaData, "test_sessions", "auto_submitted")) {
            executeQuietly(conn, "ALTER TABLE test_sessions ADD COLUMN auto_submitted BOOLEAN DEFAULT FALSE");
            log.info("[DB-MIGRATION] Added auto_submitted column");
        }

        if (!columnExists(metaData, "test_sessions", "has_sections")) {
            executeQuietly(conn, "ALTER TABLE test_sessions ADD COLUMN has_sections BOOLEAN DEFAULT FALSE");
            log.info("[DB-MIGRATION] Added has_sections column");
        }

        if (!columnExists(metaData, "test_sessions", "section_progress_json")) {
            executeQuietly(conn, "ALTER TABLE test_sessions ADD COLUMN section_progress_json TEXT");
            log.info("[DB-MIGRATION] Added section_progress_json column");
        }

        if (!columnExists(metaData, "test_sessions", "section_time_seconds")) {
            executeQuietly(conn, "ALTER TABLE test_sessions ADD COLUMN section_time_seconds INTEGER DEFAULT 0");
            log.info("[DB-MIGRATION] Added section_time_seconds column");
        }

        if (!columnExists(metaData, "test_sessions", "current_section")) {
            executeQuietly(conn, "ALTER TABLE test_sessions ADD COLUMN current_section VARCHAR(50) DEFAULT 'INFO'");
            log.info("[DB-MIGRATION] Added current_section column");
        }

        if (!columnExists(metaData, "test_sessions", "answered_count")) {
            executeQuietly(conn, "ALTER TABLE test_sessions ADD COLUMN answered_count INTEGER DEFAULT 0");
            log.info("[DB-MIGRATION] Added answered_count column");
        }

        if (!columnExists(metaData, "test_sessions", "expired_at")) {
            executeQuietly(conn, "ALTER TABLE test_sessions ADD COLUMN expired_at TIMESTAMP");
            log.info("[DB-MIGRATION] Added expired_at column");
        }

        // Add timed column if it doesn't exist
        if (!columnExists(metaData, "test_sessions", "timed")) {
            executeQuietly(conn, "ALTER TABLE test_sessions ADD COLUMN timed BOOLEAN DEFAULT TRUE");
            log.info("[DB-MIGRATION] Added timed column");
        }

        // Fix NULL values for timed column
        if (columnExists(metaData, "test_sessions", "timed")) {
            executeQuietly(conn, "UPDATE test_sessions SET timed = true WHERE timed IS NULL");
            executeQuietly(conn, "ALTER TABLE test_sessions ALTER COLUMN timed SET NOT NULL");
            log.info("[DB-MIGRATION] Fixed timed column");
        }

        // Fix NULL values for has_sections column
        if (columnExists(metaData, "test_sessions", "has_sections")) {
            executeQuietly(conn, "UPDATE test_sessions SET has_sections = false WHERE has_sections IS NULL");
        }

        log.info("[DB-MIGRATION] test_sessions migration completed");
    }

    private void createTestSessionsTable(Connection conn) throws Exception {
        String sql = """
            CREATE TABLE test_sessions (
                id BIGSERIAL PRIMARY KEY,
                user_id BIGINT NOT NULL,
                test_id BIGINT,
                test_title VARCHAR(500),
                test_type VARCHAR(50) DEFAULT 'FULL_TEST',
                level VARCHAR(50) DEFAULT 'A2',
                status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS',
                started_at TIMESTAMP,
                submitted_at TIMESTAMP,
                expired_at TIMESTAMP,
                total_time_seconds INTEGER DEFAULT 0,
                remaining_seconds INTEGER DEFAULT 0,
                timed BOOLEAN DEFAULT TRUE NOT NULL,
                has_sections BOOLEAN DEFAULT FALSE NOT NULL,
                section_time_seconds INTEGER DEFAULT 0,
                current_section VARCHAR(50) DEFAULT 'INFO',
                section_progress_json TEXT,
                questions_count INTEGER DEFAULT 0,
                answered_count INTEGER DEFAULT 0,
                answers_json TEXT,
                auto_submitted BOOLEAN DEFAULT FALSE
            )
            """;
        executeQuietly(conn, sql);
        log.info("[DB-MIGRATION] Created test_sessions table");
    }

    private boolean tableExists(DatabaseMetaData metaData, String tableName) throws Exception {
        try (ResultSet rs = metaData.getTables(null, null, tableName, new String[]{"TABLE"})) {
            return rs.next();
        }
    }

    private boolean columnExists(DatabaseMetaData metaData, String tableName, String columnName) throws Exception {
        try (ResultSet rs = metaData.getColumns(null, null, tableName, columnName)) {
            return rs.next();
        }
    }

    private void executeQuietly(Connection conn, String sql) {
        try (Statement stmt = conn.createStatement()) {
            stmt.execute(sql);
        } catch (Exception e) {
            log.debug("[DB-MIGRATION] SQL warning (may be OK): {}", e.getMessage());
        }
    }
}
