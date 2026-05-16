package com.abcenglish;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseSchemaFix implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbc;

    @Override
    public void run(String... args) {
        try {
            addColumnIfNotExists("users", "forum_reputation", "INTEGER DEFAULT 0");
            addColumnIfNotExists("users", "forum_posts", "INTEGER DEFAULT 0");
            addColumnIfNotExists("users", "forum_answers", "INTEGER DEFAULT 0");
            addColumnIfNotExists("users", "accepted_answers", "INTEGER DEFAULT 0");
            System.out.println("[DB] Forum schema columns verified successfully");
        } catch (Exception e) {
            System.err.println("[DB] Warning: Could not add forum columns: " + e.getMessage());
        }
    }

    private void addColumnIfNotExists(String table, String column, String definition) {
        try {
            String checkSql = "SELECT 1 FROM information_schema.columns WHERE table_name = ? AND column_name = ?";
            Integer exists = jdbc.queryForObject(checkSql, Integer.class, table, column);
            if (exists == null) {
                String alterSql = "ALTER TABLE " + table + " ADD COLUMN " + column + " " + definition;
                jdbc.execute(alterSql);
                System.out.println("[DB] Added column: " + table + "." + column);
            }
        } catch (Exception e) {
            System.err.println("[DB] Column check failed for " + column + ": " + e.getMessage());
        }
    }
}
