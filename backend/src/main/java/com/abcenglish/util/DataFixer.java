package com.abcenglish.util;

import java.sql.*;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class DataFixer {

    private static final String URL = "jdbc:postgresql://localhost:5432/abcenglish";
    private static final String USER = "postgres";
    private static final String PASS = "password";

    public static void main(String[] args) {
        // Force UTF-8 connection
        System.setProperty("file.encoding", "UTF-8");
        try {
            fixEncoding();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static void fixEncoding() throws Exception {
        // First, set client encoding to UTF8
        try (Connection conn = DriverManager.getConnection(URL, USER, PASS)) {
            Statement s = conn.createStatement();
            s.executeUpdate("SET client_encoding = 'UTF8'");

            // Verify
            ResultSet rs = s.executeQuery("SHOW client_encoding");
            rs.next();
            System.out.println("Client encoding: " + rs.getString(1));
            rs.close();

            // Clear test data
            s.executeUpdate("DELETE FROM test_result");
            s.executeUpdate("DELETE FROM test_session");
            s.executeUpdate("DELETE FROM test");

            // Insert fresh test data with explicit UTF-8 strings
            List<Map<String, Object>> tests = createTestData();
            PreparedStatement ps = conn.prepareStatement(
                "INSERT INTO test (title, description, type, level, duration_minutes, passing_score, total_questions, max_score, timed, active, question_data, created_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
                Statement.RETURN_GENERATED_KEYS
            );

            for (Map<String, Object> test : tests) {
                ps.setString(1, (String) test.get("title"));
                ps.setString(2, (String) test.get("description"));
                ps.setString(3, (String) test.get("type"));
                ps.setString(4, (String) test.get("level"));
                ps.setInt(5, (Integer) test.get("duration"));
                ps.setInt(6, (Integer) test.get("passingScore"));
                ps.setInt(7, (Integer) test.get("totalQuestions"));
                ps.setInt(8, (Integer) test.get("maxScore"));
                ps.setBoolean(9, (Boolean) test.get("timed"));
                ps.setBoolean(10, true);
                ps.setString(11, (String) test.get("questionData"));

                ps.executeUpdate();
                ResultSet generated = ps.getGeneratedKeys();
                if (generated.next()) {
                    System.out.println("Inserted test: " + test.get("title") + " (ID: " + generated.getInt(1) + ")");
                }
            }
            ps.close();

            // Verify
            rs = s.executeQuery("SELECT title FROM test");
            System.out.println("\nVerifying stored titles:");
            while (rs.next()) {
                String title = rs.getString(1);
                System.out.println("  Stored: " + title);
                System.out.println("  Bytes: " + bytesToHex(title.getBytes("UTF-8")));
            }

            s.close();
        }
        System.out.println("\nDone!");
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02X ", b));
        }
        return sb.toString();
    }

    private static List<Map<String, Object>> createTestData() {
        List<Map<String, Object>> tests = new ArrayList<>();

        tests.add(makeTest(
            "B\u00e0i Ki\u1ec3m Tra T\u1eeb V\u1ef1ng A1",
            "Ki\u1ec3m tra t\u1eeb v\u1ef1ng c\u01a1 b\u1ea3n cho ng\u01b0\u1eddi h\u1ecdc level A1",
            "VOCAB_QUIZ", "A1", 15, 6, 10, true,
            List.of(
                q("What does 'Hello' mean?", List.of("Xin ch\u00e0o", "T\u1ea1m bi\u1ec7t", "C\u1ea3m \u01a1n", "Xin l\u1ed7i"), 0),
                q("What is the Vietnamese for 'Water'?", List.of("S\u00e1ch", "N\u01b0\u1edbc", "T\u00e1o", "M\u00e8o"), 1),
                q("Choose the correct translation: 'Cat'", List.of("Con ch\u00f3", "Con m\u00e8o", "Con chim", "Con c\u00e1"), 1),
                q("What does 'Thank you' express?", List.of("S\u1ef1 xin l\u1ed7i", "S\u1ef1 vui v\u1ebb", "S\u1ef1 bi\u1ebft \u01a1n", "S\u1ef1 ng\u1ea1c nhi\u00ean"), 2),
                q("How do you say 'Beautiful' in Vietnamese?", List.of("Bu\u1ed3n", "\u0110\u1eb9p", "X\u1ea5u", "L\u1edbn"), 1),
                q("'Happy' means:", List.of("Bu\u1ed3n", "T\u1ee9c gi\u1eadn", "Vui / H\u1ea1nh ph\u00fac", "S\u1ee3 h\u00e3i"), 2),
                q("What is 'Apple' in Vietnamese?", List.of("Chu\u1ed1i", "Cam", "T\u00e1o", "Nho"), 2),
                q("'Please' can be translated as:", List.of("C\u1ea3m \u01a1n", "Xin l\u1ed7i", "L\u00e0m \u01a1n / Xin vui l\u00f2ng", "T\u1ea1m bi\u1ec7t"), 2),
                q("What does 'Sun' mean?", List.of("M\u1eb7t tr\u0103ng", "M\u1eb7t tr\u1eddi", "Sao", "Ng\u00f4i nh\u00e0"), 1),
                q("'Friend' means:", List.of("K\u1ebb th\u00f9", "B\u1ea1n b\u00e8", "Gia \u0111\u00ecnh", "Th\u1ea7y c\u00f4"), 1)
            )
        ));

        tests.add(makeTest(
            "B\u00e0i Ki\u1ec3m Tra Ng\u1eef Ph\u00e1p A1",
            "Ki\u1ec3m tra ng\u1eef ph\u00e1p ti\u1ebfng Anh c\u01a1 b\u1ea3n cho ng\u01b0\u1eddi h\u1ecdc level A1",
            "GRAMMAR", "A1", 15, 6, 10, true,
            List.of(
                q("Choose the correct sentence:", List.of("I am happy", "I is happy", "I are happy", "I be happy"), 0),
                q("'She ___ a student.' Choose the correct verb:", List.of("is", "are", "am", "be"), 0),
                q("Complete: 'This ___ my book.'", List.of("is", "are", "am", "be"), 0),
                q("Which is a proper question?", List.of("You are okay", "Are you okay?", "You are okay?", "Are you okay"), 1),
                q("Choose the correct negative:", List.of("I not like", "I no like", "I don't like", "I not like it"), 2),
                q("'I have ___ apple.' Choose the correct article:", List.of("a", "an", "the", "some"), 1),
                q("Which word is a verb?", List.of("Happy", "Beautiful", "Run", "Cat"), 2),
                q("Choose the correct plural:", List.of("Childs", "Children", "Childrens", "Child"), 1),
                q("'He ___ to school every day.' Choose:", List.of("go", "goes", "going", "went"), 1),
                q("Which sentence is correct?", List.of("I like cats", "I likes cats", "I liking cats", "I liked cats"), 0)
            )
        ));

        tests.add(makeTest(
            "Ki\u1ec3m Tra \u0110\u1ea7u V\u00e0o Level A1",
            "B\u00e0i ki\u1ec3m tra \u0111\u1ea7u v\u00e0o \u0111\u1ec3 x\u1ebfp l\u1edbp A1",
            "PLACEMENT", "A1", 20, 7, 10, true,
            List.of(
                q("What is the English for 'Xin ch\u00e0o'?", List.of("Goodbye", "Hello", "Sorry", "Thank you"), 1),
                q("How do you spell the word meaning 'n\u01b0\u1edbc'?", List.of("Watter", "Water", "Weter", "Watir"), 1),
                q("Which word means '\u0111\u1eb9p'?", List.of("Happy", "Beautiful", "Sad", "Angry"), 1),
                q("Complete: 'The ___ is shining.' (m\u1eb7t tr\u1eddi)", List.of("Moon", "Star", "Sun", "Sky"), 2),
                q("Choose the correct answer: 2 + 3 = ?", List.of("Four", "Five", "Six", "Seven"), 1),
                q("What color is the sky?", List.of("Red", "Blue", "Green", "Yellow"), 1),
                q("'Dog' in Vietnamese is:", List.of("M\u00e8o", "Chim", "Ch\u00f3", "C\u00e1"), 2),
                q("Choose the correct greeting:", List.of("Good night", "Good morning", "Goodbye", "Sorry"), 1),
                q("'Please' means:", List.of("C\u1ea3m \u01a1n", "Xin l\u1ed7i", "L\u00e0m \u01a1n", "T\u1ea1m bi\u1ec7t"), 2),
                q("Which is an animal?", List.of("Book", "Water", "Dog", "House"), 2)
            )
        ));

        return tests;
    }

    private static Map<String, Object> makeTest(String title, String desc, String type, String level,
            int duration, int passingScore, int maxScore, boolean timed,
            List<Map<String, Object>> questions) {
        Map<String, Object> test = new LinkedHashMap<>();
        test.put("title", title);
        test.put("description", desc);
        test.put("type", type);
        test.put("level", level);
        test.put("duration", duration);
        test.put("passingScore", passingScore);
        test.put("maxScore", maxScore);
        test.put("timed", timed);
        test.put("totalQuestions", questions.size());
        test.put("questionData", toJson(questions));
        return test;
    }

    private static Map<String, Object> q(String question, List<String> options, int correct) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("question", question);
        m.put("options", options);
        m.put("correctAnswer", String.valueOf(correct));
        m.put("points", 1);
        return m;
    }

    private static String toJson(List<Map<String, Object>> list) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            if (i > 0) sb.append(",");
            Map<String, Object> m = list.get(i);
            sb.append("{\"question\":\"").append(escape((String)m.get("question"))).append("\",");
            sb.append("\"options\":[");
            List<String> opts = (List<String>) m.get("options");
            for (int j = 0; j < opts.size(); j++) {
                if (j > 0) sb.append(",");
                sb.append("\"").append(escape(opts.get(j))).append("\"");
            }
            sb.append("],");
            sb.append("\"correctAnswer\":\"").append(m.get("correctAnswer")).append("\",");
            sb.append("\"points\":").append(m.get("points"));
            sb.append("}");
        }
        sb.append("]");
        return sb.toString();
    }

    private static String escape(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t");
    }
}
