package com.abcenglish.config;

import com.abcenglish.entity.*;
import com.abcenglish.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Configuration
@Profile("!test")
@Slf4j
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(
            UserRepository userRepository,
            CourseRepository courseRepository,
            VocabularyRepository vocabularyRepository,
            ExerciseRepository exerciseRepository,
            ExerciseQuestionRepository questionRepository,
            TestRepository testRepository,
            TestResultRepository testResultRepository,
            TestSessionRepository testSessionRepository,
            ForumPostRepository forumPostRepository,
            ForumCommentRepository forumCommentRepository,
            UserProgressRepository progressRepository,
            QuizResultRepository quizResultRepository,
            UserBadgeRepository badgeRepository,
            DailyChallengeRepository dailyChallengeRepository,
            UserChallengeRepository userChallengeRepository,
            SavedWordRepository savedWordRepository,
            StoryRepository storyRepository,
            StoryStepRepository storyStepRepository,
            UserStoryProgressRepository userStoryProgressRepository,
            AIChatHistoryRepository chatHistoryRepository,
            LessonRepository lessonRepository,
            LessonContentRepository lessonContentRepository,
            PasswordEncoder passwordEncoder,
            ObjectMapper objectMapper
    ) {
        return args -> {
            // ── SEED USERS ──────────────────────────────────────────────────────────
            if (userRepository.count() == 0) {
                seedUsers(userRepository, passwordEncoder);
            }

            // ── SEED COURSES ─────────────────────────────────────────────────────
            if (courseRepository.count() == 0) {
                seedCourses(courseRepository);
            }

            // ── SEED LESSONS ─────────────────────────────────────────────────────
            if (lessonRepository.count() == 0) {
                seedLessons(lessonRepository, courseRepository);
            }

            // ── SEED LESSON CONTENTS ─────────────────────────────────────────────
            if (lessonContentRepository.count() == 0) {
                List<Lesson> allLessons = lessonRepository.findAll();
                if (!allLessons.isEmpty()) {
                    seedLessonContents(lessonContentRepository, allLessons);
                }
            }

            // ── SEED VOCABULARY ────────────────────────────────────────────────────
            if (vocabularyRepository.count() == 0) {
                seedVocabulary(vocabularyRepository);
            }

            // ── SEED EXERCISES ────────────────────────────────────────────────────
            if (exerciseRepository.count() == 0) {
                seedExercises(exerciseRepository, questionRepository, objectMapper);
            }

            // ── SEED TESTS ────────────────────────────────────────────────────────
            if (testRepository.count() == 0) {
                seedTests(testRepository, objectMapper);
            }

            // ── SEED USER PROGRESS & RESULTS ───────────────────────────────────────
            if (progressRepository.count() == 0) {
                seedUserProgress(progressRepository, quizResultRepository,
                        userRepository, courseRepository, lessonRepository);
            }

            // ── SEED TEST RESULTS ─────────────────────────────────────────────────
            if (testResultRepository.count() == 0) {
                seedTestResults(testResultRepository, testSessionRepository,
                        testRepository, userRepository);
            }

            // ── SEED BADGES ──────────────────────────────────────────────────────
            if (badgeRepository.count() == 0) {
                seedBadges(badgeRepository, userRepository);
            }

            // ── SEED DAILY CHALLENGES ─────────────────────────────────────────────
            if (dailyChallengeRepository.count() == 0) {
                seedDailyChallenges(dailyChallengeRepository, userChallengeRepository, userRepository);
            }

            // ── SEED FORUM ────────────────────────────────────────────────────────
            if (forumPostRepository.count() == 0) {
                seedForum(forumPostRepository, forumCommentRepository, userRepository);
            }

            // ── SEED SAVED WORDS ─────────────────────────────────────────────────
            if (savedWordRepository.count() == 0) {
                seedSavedWords(savedWordRepository, vocabularyRepository, userRepository);
            }

            // ── SEED STORIES ──────────────────────────────────────────────────────
            if (storyRepository.count() == 0) {
                seedStories(storyRepository, userStoryProgressRepository, userRepository);
            }

            // ── SEED AI CHAT HISTORY ──────────────────────────────────────────────
            if (chatHistoryRepository.count() == 0) {
                seedAIChat(chatHistoryRepository, userRepository);
            }

            log.info("=== DataInitializer: All seeds completed ===");
        };
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // USERS
    // ══════════════════════════════════════════════════════════════════════════════
    private void seedUsers(UserRepository repo, PasswordEncoder encoder) {
        // Admin
        User admin = mkUser("admin", "admin@abc.com", encoder.encode("admin123"),
                "Nguyễn Văn Minh", User.Role.ADMIN, User.Level.C2, User.AgeGroup.ADULT);
        repo.save(admin);

        // Teachers
        User t1 = mkUser("teacher_sarah", "sarah@abc.com", encoder.encode("teacher123"),
                "Sarah Johnson", User.Role.TEACHER, User.Level.C2, User.AgeGroup.ADULT);
        t1.setAvatarUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=sarah");
        repo.save(t1);

        User t2 = mkUser("teacher_marcus", "marcus@abc.com", encoder.encode("teacher123"),
                "Marcus Williams", User.Role.TEACHER, User.Level.B2, User.AgeGroup.ADULT);
        t2.setAvatarUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=marcus");
        repo.save(t2);

        // Students
        User s1 = mkUser("student", "student@abc.com", encoder.encode("student123"),
                "Trần Minh Tuấn", User.Role.STUDENT, User.Level.A1, User.AgeGroup.TEEN);
        s1.setAvatarUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=tuan");
        repo.save(s1);

        User s2 = mkUser("linda_lee", "linda@abc.com", encoder.encode("student123"),
                "Lê Thị Hồng Linh", User.Role.STUDENT, User.Level.A2, User.AgeGroup.ADULT);
        s2.setAvatarUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=linda");
        repo.save(s2);

        User s3 = mkUser("david_chen", "david@abc.com", encoder.encode("student123"),
                "David Chen", User.Role.STUDENT, User.Level.B1, User.AgeGroup.ADULT);
        s3.setAvatarUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=david");
        repo.save(s3);

        User s4 = mkUser("emma_watson", "emma@abc.com", encoder.encode("student123"),
                "Phạm Thị Thu Hà", User.Role.STUDENT, User.Level.B2, User.AgeGroup.TEEN);
        s4.setAvatarUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=emma");
        repo.save(s4);

        User s5 = mkUser("alex_kim", "alex@abc.com", encoder.encode("student123"),
                "Kim Ngọc Ánh", User.Role.STUDENT, User.Level.C1, User.AgeGroup.ADULT);
        s5.setAvatarUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=alex");
        repo.save(s5);

        User s6 = mkUser("minhpham", "minh.pham@abc.com", encoder.encode("student123"),
                "Phạm Đức Minh", User.Role.STUDENT, User.Level.A1, User.AgeGroup.KID);
        s6.setAvatarUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=minh");
        repo.save(s6);

        User s7 = mkUser("lisa_nguyen", "lisa@abc.com", encoder.encode("student123"),
                "Nguyễn Thị Minh Châu", User.Role.STUDENT, User.Level.B1, User.AgeGroup.TEEN);
        s7.setAvatarUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=lisa");
        repo.save(s7);

        User s8 = mkUser("tom_hardy", "tom@abc.com", encoder.encode("student123"),
                "Hardy Tom", User.Role.STUDENT, User.Level.A2, User.AgeGroup.ADULT);
        s8.setAvatarUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=tom");
        repo.save(s8);

        log.info("  → Seeded 11 users (1 admin, 2 teachers, 8 students)");
    }

    private User mkUser(String username, String email, String password,
                        String fullName, User.Role role, User.Level level, User.AgeGroup ageGroup) {
        User u = new User(username, email, password);
        u.setFullName(fullName);
        u.setRole(role);
        u.setLevel(level);
        u.setAgeGroup(ageGroup);
        u.setEnabled(true);
        return u;
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // COURSES
    // ══════════════════════════════════════════════════════════════════════════════
    private void seedCourses(CourseRepository repo) {
        repo.saveAll(List.of(
            mkCourse("Essential English A1",
                    "Start your English journey with everyday vocabulary, greetings, and basic conversations. Perfect for beginners who want to build a solid foundation.",
                    User.Level.A1, "Sarah Johnson", 12, 4.9, "beginner", true, 248),
            mkCourse("English Conversation A2",
                    "Improve your speaking skills through practical dialogues about daily life, shopping, travel, and social situations.",
                    User.Level.A2, "Marcus Williams", 15, 4.7, "conversation", true, 185),
            mkCourse("Intermediate Grammar B1",
                    "Master essential grammar structures including past tenses, conditionals, and reported speech to express yourself more clearly.",
                    User.Level.B1, "Sarah Johnson", 20, 4.8, "grammar", true, 142),
            mkCourse("Business English B2",
                    "Communicate professionally in workplace situations including meetings, presentations, negotiations, and email writing.",
                    User.Level.B2, "Marcus Williams", 18, 4.6, "business", false, 97),
            mkCourse("Advanced Academic English C1",
                    "Develop fluency for academic and professional contexts with complex vocabulary, formal writing, and critical thinking skills.",
                    User.Level.C1, "Sarah Johnson", 16, 4.5, "academic", false, 54)
        ));
        log.info("  → Seeded 5 courses");
    }

    private Course mkCourse(String title, String desc, User.Level lvl, String instructor,
                           int lessons, double rating, String category, boolean featured, int enrolled) {
        Course c = new Course();
        c.setTitle(title);
        c.setDescription(desc);
        c.setLevel(lvl);
        c.setInstructor(instructor);
        c.setTotalLessons(lessons);
        c.setRating(rating);
        c.setCategory(category);
        c.setFeatured(featured);
        c.setEnrolledCount(enrolled);
        c.setThumbnailUrl("https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400");
        return c;
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // LESSONS
    // ══════════════════════════════════════════════════════════════════════════════
    private void seedLessons(LessonRepository lessonRepo, CourseRepository courseRepo) {
        List<Course> courses = courseRepo.findAll();
        Map<String, Course> byLevel = courses.stream()
                .collect(Collectors.toMap(c -> c.getLevel().name(), c -> c));

        // A1 Course lessons
        Course a1 = byLevel.get("A1");
        if (a1 != null) {
            lessonRepo.saveAll(List.of(
                mkLesson(a1.getId(), "Greetings & Introductions", 1, 15,
                    "[{\"start\":0,\"end\":5,\"text\":\"Hello! My name is Anna. What is your name?\"},{\"start\":5,\"end\":10,\"text\":\"Nice to meet you. How are you today?\"},{\"start\":10,\"end\":15,\"text\":\"I am fine, thank you. And you?\"}]"),
                mkLesson(a1.getId(), "Numbers & Counting", 2, 20,
                    "[{\"start\":0,\"end\":7,\"text\":\"One, two, three, four, five. Let us count together!\"},{\"start\":7,\"end\":14,\"text\":\"Six, seven, eight, nine, ten. Can you count to twenty?\"}]"),
                mkLesson(a1.getId(), "Colors & Shapes", 3, 15,
                    "[{\"start\":0,\"end\":5,\"text\":\"The sky is blue. The grass is green.\"},{\"start\":5,\"end\":10,\"text\":\"I have a red apple and a yellow banana.\"},{\"start\":10,\"end\":15,\"text\":\"The circle is round. The square has four sides.\"}]"),
                mkLesson(a1.getId(), "Family Members", 4, 20,
                    "[{\"start\":0,\"end\":6,\"text\":\"This is my mother. Her name is Mary.\"},{\"start\":6,\"end\":12,\"text\":\"That is my father. His name is John.\"},{\"start\":12,\"end\":18,\"text\":\"I have one brother and one sister.\"}]"),
                mkLesson(a1.getId(), "Daily Routines", 5, 25,
                    "[{\"start\":0,\"end\":7,\"text\":\"I wake up at six o'clock every morning.\"},{\"start\":7,\"end\":14,\"text\":\"I eat breakfast at seven. Then I go to school.\"},{\"start\":14,\"end\":20,\"text\":\"In the evening, I do my homework and watch TV.\"}]"),
                mkLesson(a1.getId(), "Food & Drinks", 6, 20,
                    "[{\"start\":0,\"end\":6,\"text\":\"I would like some water, please.\"},{\"start\":6,\"end\":12,\"text\":\"For breakfast, I usually eat bread and eggs.\"},{\"start\":12,\"end\":18,\"text\":\"Do you prefer tea or coffee?\"}]"),
                mkLesson(a1.getId(), "At the Store", 7, 20,
                    "[{\"start\":0,\"end\":7,\"text\":\"How much is this shirt? It looks nice.\"},{\"start\":7,\"end\":14,\"text\":\"It is twenty dollars. Do you have it in blue?\"},{\"start\":14,\"end\":20,\"text\":\"Yes, we do. What size do you wear?\"}]"),
                mkLesson(a1.getId(), "Weather & Seasons", 8, 15,
                    "[{\"start\":0,\"end\":6,\"text\":\"What is the weather like today? It is sunny.\"},{\"start\":6,\"end\":12,\"text\":\"In summer, it is hot. In winter, it is cold.\"},{\"start\":12,\"end\":18,\"text\":\"I love autumn because the leaves are beautiful.\"}]")
            ));
        }

        // A2 Course lessons
        Course a2 = byLevel.get("A2");
        if (a2 != null) {
            lessonRepo.saveAll(List.of(
                mkLesson(a2.getId(), "Making Plans", 1, 25,
                    "[{\"start\":0,\"end\":6,\"text\":\"What are you going to do this weekend?\"},{\"start\":6,\"end\":12,\"text\":\"I am going to visit my grandmother on Saturday.\"},{\"start\":12,\"end\":18,\"text\":\"Will you come to the party tonight?\"}]"),
                mkLesson(a2.getId(), "Past Events", 2, 25,
                    "[{\"start\":0,\"end\":7,\"text\":\"Yesterday, I went to the market with my mother.\"},{\"start\":7,\"end\":14,\"text\":\"While we were walking, it started to rain.\"},{\"start\":14,\"end\":20,\"text\":\"We bought some fruits and vegetables.\"}]"),
                mkLesson(a2.getId(), "Travel & Directions", 3, 25,
                    "[{\"start\":0,\"end\":7,\"text\":\"Excuse me, how do I get to the train station?\"},{\"start\":7,\"end\":14,\"text\":\"Go straight ahead, then turn left at the traffic light.\"},{\"start\":14,\"end\":20,\"text\":\"Is it far from here? No, it is about ten minutes walk.\"}]"),
                mkLesson(a2.getId(), "Health & Body", 4, 20,
                    "[{\"start\":0,\"end\":6,\"text\":\"Good morning, doctor. I do not feel well today.\"},{\"start\":6,\"end\":12,\"text\":\"What symptoms do you have? I have a headache and a cough.\"},{\"start\":12,\"end\":18,\"text\":\"You should rest and drink plenty of water.\"}]")
            ));
        }

        // B1 Course lessons
        Course b1 = byLevel.get("B1");
        if (b1 != null) {
            lessonRepo.saveAll(List.of(
                mkLesson(b1.getId(), "Conditionals: Zero, First & Second", 1, 35,
                    "[{\"start\":0,\"end\":8,\"text\":\"If you heat water to one hundred degrees, it boils.\"},{\"start\":8,\"end\":16,\"text\":\"If it rains tomorrow, I will stay at home.\"},{\"start\":16,\"end\":24,\"text\":\"If I had more money, I would travel around the world.\"}]"),
                mkLesson(b1.getId(), "Reported Speech", 2, 35,
                    "[{\"start\":0,\"end\":8,\"text\":\"She said that she was feeling tired.\"},{\"start\":8,\"end\":16,\"text\":\"He told me that he would come to the meeting.\"},{\"start\":16,\"end\":24,\"text\":\"They asked if I could help them with the project.\"}]"),
                mkLesson(b1.getId(), "Passive Voice", 3, 30,
                    "[{\"start\":0,\"end\":8,\"text\":\"The book was written by a famous author.\"},{\"start\":8,\"end\":16,\"text\":\"English is spoken in many countries around the world.\"},{\"start\":16,\"end\":24,\"text\":\"The new bridge is being built in the city center.\"}]"),
                mkLesson(b1.getId(), "Modal Verbs: Must, Should, Could", 4, 25,
                    "[{\"start\":0,\"end\":8,\"text\":\"You should see a doctor if you feel unwell.\"},{\"start\":8,\"end\":16,\"text\":\"You must submit your assignment by Friday.\"},{\"start\":16,\"end\":24,\"text\":\"It could rain later, so bring an umbrella.\"}]")
            ));
        }

        // B2 Course lessons
        Course b2 = byLevel.get("B2");
        if (b2 != null) {
            lessonRepo.saveAll(List.of(
                mkLesson(b2.getId(), "Business Meetings", 1, 40,
                    "[{\"start\":0,\"end\":8,\"text\":\"Good morning, everyone. Let us begin the meeting.\"},{\"start\":8,\"end\":16,\"text\":\"I would like to propose three key strategies for this quarter.\"},{\"start\":16,\"end\":24,\"text\":\"Are there any questions or comments from the team?\"}]"),
                mkLesson(b2.getId(), "Email Etiquette", 2, 30,
                    "[{\"start\":0,\"end\":8,\"text\":\"Dear Mr. Thompson, I am writing to follow up on our conversation.\"},{\"start\":8,\"end\":16,\"text\":\"Please find attached the report you requested last week.\"},{\"start\":16,\"end\":24,\"text\":\"I look forward to hearing from you. Best regards.\"}]")
            ));
        }

        // C1 Course lessons
        Course c1 = byLevel.get("C1");
        if (c1 != null) {
            lessonRepo.saveAll(List.of(
                mkLesson(c1.getId(), "Academic Writing", 1, 45,
                    "[{\"start\":0,\"end\":8,\"text\":\"This essay argues that social media has fundamentally altered human communication.\"},{\"start\":8,\"end\":16,\"text\":\"According to recent studies, over seventy percent of young adults use these platforms daily.\"},{\"start\":16,\"end\":24,\"text\":\"Furthermore, the implications extend beyond personal interaction to professional environments.\"}]")
            ));
        }

        log.info("  → Seeded {} lessons", lessonRepository.count());
    }

    private void seedLessonContents(LessonContentRepository repo, List<Lesson> lessons) {
        // Group lessons by title keyword to assign appropriate content
        for (Lesson lesson : lessons) {
            String title = lesson.getTitle() != null ? lesson.getTitle().toLowerCase() : "";

            LessonContent lc = new LessonContent();
            lc.setLessonId(lesson.getId());

            if (title.contains("greeting") || title.contains("introductions")) {
                lc.setTextContent(
                    "Chào mừng bạn đến với bài học Greetings & Introductions!\n\n" +
                    "Trong bài học này, chúng ta sẽ học cách chào hỏi và giới thiệu bản thân bằng tiếng Anh.\n\n" +
                    "Các cách chào hỏi phổ biến:\n" +
                    "- Hello / Hi: Xin chào\n" +
                    "- Good morning / Good afternoon / Good evening: Chào buổi sáng/trưa/tối\n" +
                    "- How are you?: Bạn khỏe không?\n" +
                    "- Nice to meet you: Rất vui được gặp bạn\n\n" +
                    "Khi gặp ai đó lần đầu, chúng ta thường:\n" +
                    "1. Chào hỏi\n" +
                    "2. Tự giới thiệu tên\n" +
                    "3. Bắt tay (trong một số nền văn hóa)\n" +
                    "4. Trao đổi một vài câu hỏi thăm dò"
                );
                lc.setGrammarRules(
                    "[{\"title\":\"S + am/is/are + ...\",\"explanation\":\"Chủ ngữ + động từ to be. Ví dụ: I am Anna. / She is a teacher. / They are students.\"}," +
                    "{\"title\":\"My name is ... / I am ...\",\"explanation\":\"Cách giới thiệu tên: My name is Anna = I am Anna\"}," +
                    "{\"title\":\"How + to be + S?\",\"explanation\":\"Câu hỏi về tình trạng: How are you? = Are you well?\"}]"
                );
                lc.setVocabulary(
                    "[{\"word\":\"Hello\",\"pronunciation\":\"/həˈloʊ/\",\"translation\":\"Xin chào\"}," +
                    "{\"word\":\"Hi\",\"pronunciation\":\"/haɪ/\",\"translation\":\"Chào, xin chào\"}," +
                    "{\"word\":\"Good morning\",\"pronunciation\":\"/ɡʊd ˈmɔːrnɪŋ/\",\"translation\":\"Chào buổi sáng\"}," +
                    "{\"word\":\"Nice to meet you\",\"pronunciation\":\"/naɪs tu miːt juː/\",\"translation\":\"Rất vui được gặp bạn\"}," +
                    "{\"word\":\"How are you?\",\"pronunciation\":\"/haʊ ɑːr juː/\",\"translation\":\"Bạn khỏe không?\"}," +
                    "{\"word\":\"I am fine\",\"pronunciation\":\"/aɪ æm faɪn/\",\"translation\":\"Tôi khỏe\"}]"
                );
                lc.setKeyPoints(
                    "[{\"point\":\"Luôn dùng 'am' với I, 'is' với he/she/it, 'are' với you/we/they\"}," +
                    "{\"point\":\"'Hello' và 'Hi' có thể dùng trong mọi tình huống, nhưng 'Good morning/afternoon/evening' mang tính trang trọng hơn\"}," +
                    "{\"point\":\"Khi trả lời 'How are you?', ta có thể nói: I'm fine / I'm good / I'm okay / Not bad\"}]"
                );
            } else if (title.contains("number") || title.contains("counting")) {
                lc.setTextContent(
                    "Numbers & Counting - Số đếm trong tiếng Anh\n\n" +
                    "Số đếm từ 1 đến 10:\n" +
                    "one, two, three, four, five, six, seven, eight, nine, ten\n\n" +
                    "Số đếm từ 11 đến 20:\n" +
                    "eleven, twelve, thirteen, fourteen, fifteen, sixteen, seventeen, eighteen, nineteen, twenty\n\n" +
                    "Số tròn chục:\n" +
                    "twenty, thirty, forty, fifty, sixty, seventy, eighty, ninety, one hundred"
                );
                lc.setGrammarRules(
                    "[{\"title\":\"Số đếm + Danh từ số nhiều\",\"explanation\":\"One book, two books, three books. Số đếm luôn đứng trước danh từ.\"}]"
                );
                lc.setVocabulary(
                    "[{\"word\":\"one\",\"pronunciation\":\"/wʌn/\",\"translation\":\"một\"}," +
                    "{\"word\":\"two\",\"pronunciation\":\"/tuː/\",\"translation\":\"hai\"}," +
                    "{\"word\":\"three\",\"pronunciation\":\"/θriː/\",\"translation\":\"ba\"}," +
                    "{\"word\":\"four\",\"pronunciation\":\"/fɔːr/\",\"translation\":\"bốn\"}," +
                    "{\"word\":\"five\",\"pronunciation\":\"/faɪv/\",\"translation\":\"năm\"}," +
                    "{\"word\":\"ten\",\"pronunciation\":\"/ten/\",\"translation\":\"mười\"}]"
                );
                lc.setKeyPoints(
                    "[{\"point\":\"Số 12 và số có đuôi -teen có trọng âm ở giữa. Ví dụ: thirteen /θɜːrˈtiːn/\"}," +
                    "{\"point\":\"Số có đuôi -ty có trọng âm ở đầu. Ví dụ: thirteen vs. thirty\"}," +
                    "{\"point\":\"Thường dùng 'a' hoặc 'one' cho số 1: a hundred = one hundred\"}]"
                );
            } else if (title.contains("color") || title.contains("shape")) {
                lc.setTextContent(
                    "Colors & Shapes - Màu sắc và hình dạng\n\n" +
                    "Màu sắc cơ bản:\n" +
                    "red, orange, yellow, green, blue, purple, pink, brown, black, white, gray\n\n" +
                    "Hình dạng cơ bản:\n" +
                    "circle (hình tròn), square (hình vuông), triangle (hình tam giác), rectangle (hình chữ nhật), star (hình ngôi sao)"
                );
                lc.setGrammarRules(
                    "[{\"title\":\"S + be + màu sắc\",\"explanation\":\"The sky is blue. The grass is green.\"}]"
                );
                lc.setVocabulary(
                    "[{\"word\":\"red\",\"pronunciation\":\"/red/\",\"translation\":\"đỏ\"}," +
                    "{\"word\":\"blue\",\"pronunciation\":\"/bluː/\",\"translation\":\"xanh dương\"}," +
                    "{\"word\":\"green\",\"pronunciation\":\"/ɡriːn/\",\"translation\":\"xanh lá\"}," +
                    "{\"word\":\"yellow\",\"pronunciation\":\"/ˈjeloʊ/\",\"translation\":\"vàng\"}," +
                    "{\"word\":\"circle\",\"pronunciation\":\"/ˈsɜːrkəl/\",\"translation\":\"hình tròn\"}," +
                    "{\"word\":\"square\",\"pronunciation\":\"/skwer/\",\"translation\":\"hình vuông\"}]"
                );
                lc.setKeyPoints(
                    "[{\"point\":\"Màu sắc có thể dùng làm tính từ: a red apple, a blue sky\"}," +
                    "{\"point\":\"Khi mô tả hình dạng, thường dùng 'is' + hình: The circle is round.\"}]"
                );
            } else if (title.contains("family")) {
                lc.setTextContent(
                    "Family Members - Các thành viên trong gia đình\n\n" +
                    "Bố mẹ và anh chị em:\n" +
                    "mother (mẹ), father (bố), parents (bố mẹ), sister (chị/em gái), brother (anh/em trai)\n\n" +
                    "Thế hệ khác:\n" +
                    "grandmother (bà), grandfather (ông), grandparents (ông bà), aunt (cô/dì), uncle (chú/bác), cousin (anh chị em họ)\n\n" +
                    "Con cái:\n" +
                    "son (con trai), daughter (con gái), children (con cái)"
                );
                lc.setGrammarRules(
                    "[{\"title\":\"This is my + ...\",\"explanation\":\"This is my mother. That is my father.\"}," +
                    "{\"title\":\"S + have/has got + ...\",\"explanation\":\"I have got one brother and one sister.\"}]"
                );
                lc.setVocabulary(
                    "[{\"word\":\"mother\",\"pronunciation\":\"/ˈmʌðər/\",\"translation\":\"mẹ\"}," +
                    "{\"word\":\"father\",\"pronunciation\":\"/ˈfɑːðər/\",\"translation\":\"bố\"}," +
                    "{\"word\":\"sister\",\"pronunciation\":\"/ˈsɪstər/\",\"translation\":\"chị/em gái\"}," +
                    "{\"word\":\"brother\",\"pronunciation\":\"/ˈbrʌðər/\",\"translation\":\"anh/em trai\"}," +
                    "{\"word\":\"grandmother\",\"pronunciation\":\"/ˈɡrænmʌðər/\",\"translation\":\"bà\"}," +
                    "{\"word\":\"grandfather\",\"pronunciation\":\"/ˈɡrænfɑːðər/\",\"translation\":\"ông\"}]"
                );
                lc.setKeyPoints(
                    "[{\"point\":\"Dùng 'my' để chỉ sở hữu: my mother, my brother\"}," +
                    "{\"point\":\"His/her dùng khi không dùng 'my': Her name is Mary.\"}," +
                    "{\"point\":\"'Parent' là danh từ chung cho cả bố và mẹ\"}]"
                );
            } else if (title.contains("daily routine") || title.contains("routine")) {
                lc.setTextContent(
                    "Daily Routines - Thói quen hàng ngày\n\n" +
                    "Buổi sáng:\n" +
                    "wake up (thức dậy), get up (rời giường), brush teeth (đánh răng), have breakfast (ăn sáng), go to school/work (đi học/đi làm)\n\n" +
                    "Buổi chiều/tối:\n" +
                    "have lunch (ăn trưa), do homework (làm bài tập), have dinner (ăn tối), watch TV (xem TV), go to bed (đi ngủ)\n\n" +
                    "Thì hiện tại đơn (Present Simple) dùng để diễn tả thói quen hàng ngày."
                );
                lc.setGrammarRules(
                    "[{\"title\":\"Present Simple với thói quen\",\"explanation\":\"I wake up at six o'clock every morning. She eats breakfast at seven.\"}," +
                    "{\"title\":\"Trạng từ tần suất\",\"explanation\":\"always, usually, often, sometimes, never - đặt trước động từ thường, sau to be.\"}]"
                );
                lc.setVocabulary(
                    "[{\"word\":\"wake up\",\"pronunciation\":\"/weɪk ʌp/\",\"translation\":\"thức dậy\"}," +
                    "{\"word\":\"breakfast\",\"pronunciation\":\"/ˈbrekfəst/\",\"translation\":\"bữa sáng\"}," +
                    "{\"word\":\"homework\",\"pronunciation\":\"/ˈhoʊmwɜːrd/\",\"translation\":\"bài tập về nhà\"}," +
                    "{\"word\":\"dinner\",\"pronunciation\":\"/ˈdɪnər/\",\"translation\":\"bữa tối\"}]"
                );
                lc.setKeyPoints(
                    "[{\"point\":\"Với đại từ I/you/we/they: động từ nguyên mẫu. Ví dụ: I wake up, You go\"}," +
                    "{\"point\":\"Với he/she/it: động từ + s/es. Ví dụ: He wakes up, She goes\"}]"
                );
            } else if (title.contains("conditional")) {
                lc.setTextContent(
                    "Conditionals - Câu điều kiện\n\n" +
                    "Thì điều kiện không thực (Zero Conditional) - Sự thật hiển nhiên:\n" +
                    "If + S + V (hiện tại), S + will + V (kết quả)\n" +
                    "Ví dụ: If you heat water, it boils.\n\n" +
                    "Điều kiện loại 1 (First Conditional) - Có thể xảy ra:\n" +
                    "If + S + V (hiện tại đơn), S + will + V\n" +
                    "Ví dụ: If it rains tomorrow, I will stay home.\n\n" +
                    "Điều kiện loại 2 (Second Conditional) - Tưởng tượng, không có thật:\n" +
                    "If + S + V (quá khứ đơn), S + would + V\n" +
                    "Ví dụ: If I had more money, I would travel."
                );
                lc.setGrammarRules(
                    "[{\"title\":\"Cấu trúc If clause\",\"explanation\":\"If + S + V (present), S + will + V (result). Lưu ý: KHÔNG dùng will trong mệnh đề If.\"}," +
                    "{\"title\":\"Zero Conditional\",\"explanation\":\"Dùng để diễn tả sự thật luôn đúng: If you mix red and blue, you get purple.\"}," +
                    "{\"title\":\"Second Conditional\",\"explanation\":\"Dùng để diễn tả tình huống tưởng tượng ở hiện tại/tương lai.\"}]"
                );
                lc.setVocabulary(
                    "[{\"word\":\"if\",\"pronunciation\":\"/ɪf/\",\"translation\":\"nếu\"}," +
                    "{\"word\":\"condition\",\"pronunciation\":\"/kənˈdɪʃən/\",\"translation\":\"điều kiện\"}," +
                    "{\"word\":\"would\",\"pronunciation\":\"/wʊd/\",\"translation\":\"sẽ (điều kiện)\"}]"
                );
                lc.setKeyPoints(
                    "[{\"point\":\"Zero: sự thật khoa học. First: có thể xảy ra. Second: tưởng tượng.\"}," +
                    "{\"point\":\"Trong câu điều kiện, có thể đảo If lên đầu hoặc để cuối câu.\"}," +
                    "{\"point\":\"KHÔNG dùng 'will' trong mệnh đề điều kiện If.\"}]"
                );
            } else if (title.contains("passive")) {
                lc.setTextContent(
                    "Passive Voice - Câu bị động\n\n" +
                    "Câu chủ động: S + V + O\n" +
                    "Câu bị động: O + be + V3 (past participle) + (by S)\n\n" +
                    "Các thì trong bị động:\n" +
                    "- Hiện tại đơn: am/is/are + V3\n" +
                    "- Quá khứ đơn: was/were + V3\n" +
                    "- Hiện tại tiếp diễn: am/is/are + being + V3\n" +
                    "- Tương lai: will + be + V3"
                );
                lc.setGrammarRules(
                    "[{\"title\":\"Công thức bị động\",\"explanation\":\"Tân ngữ (O) trở thành chủ ngữ. Động từ to be + V3. Chủ ngữ cũ trở thành 'by + ...'.\"}," +
                    "{\"title\":\"Khi nào dùng bị động\",\"explanation\":\"Khi không biết ai làm, hoặc khi quan trọng hơn là sự vật/sự việc được nhấn mạnh.\"}]"
                );
                lc.setVocabulary(
                    "[{\"word\":\"passive\",\"pronunciation\":\"/ˈpæsɪv/\",\"translation\":\"bị động\"}," +
                    "{\"word\":\"active\",\"pronunciation\":\"/ˈæktɪv/\",\"translation\":\"chủ động\"}," +
                    "{\"word\":\"written\",\"pronunciation\":\"/ˈrɪtən/\",\"translation\":\"được viết (V3 của write)\"}]"
                );
                lc.setKeyPoints(
                    "[{\"point\":\"BE phải phù hợp với thì và chủ ngữ mới.\"}," +
                    "{\"point\":\"V3 (past participle) không thay đổi theo thì.\"}," +
                    "{\"point\":\"Trong bị động, 'by + người' có thể bỏ qua nếu không quan trọng.\"}]"
                );
            } else {
                // Default generic content for other lessons
                lc.setTextContent(
                    "Chào mừng bạn đến với bài học: " + (lesson.getTitle() != null ? lesson.getTitle() : "") + "\n\n" +
                    "Trong bài học này, bạn sẽ:\n" +
                    "1. Tìm hiểu các khái niệm cơ bản\n" +
                    "2. Học từ vựng liên quan\n" +
                    "3. Thực hành qua các bài tập\n" +
                    "4. Làm bài kiểm tra để củng cố kiến thức"
                );
                lc.setGrammarRules(
                    "[{\"title\":\"Cấu trúc câu cơ bản\",\"explanation\":\"Một câu tiếng Anh gồm: Chủ ngữ (S) + Động từ (V) + Tân ngữ (O)\"}," +
                    "{\"title\":\"Thì tiếng Anh\",\"explanation\":\"Tiếng Anh có nhiều thì để diễn tả thời gian: hiện tại, quá khứ, tương lai.\"}]"
                );
                lc.setVocabulary(
                    "[{\"word\":\"learn\",\"pronunciation\":\"/lɜːrn/\",\"translation\":\"học, học hỏi\"}," +
                    "{\"word\":\"practice\",\"pronunciation\":\"/ˈpræktɪs/\",\"translation\":\"thực hành, luyện tập\"}," +
                    "{\"word\":\"understand\",\"pronunciation\":\"/ˌʌndərˈstænd/\",\"translation\":\"hiểu\"}]"
                );
                lc.setKeyPoints(
                    "[{\"point\":\"Đọc kỹ nội dung bài học trước khi làm bài tập\"}," +
                    "{\"point\":\"Luyện tập thường xuyên để ghi nhớ từ vựng và ngữ pháp\"}," +
                    "{\"point\":\"Đặt câu với từ vựng mới để ghi nhớ lâu hơn\"}]"
                );
            }

            repo.save(lc);
        }
        log.info("  → Seeded {} lesson contents", repo.count());
    }

    private Lesson mkLesson(Long courseId, String title, int order, int duration,
                            String subtitleJson) {
        Lesson l = new Lesson();
        l.setCourseId(courseId);
        l.setTitle(title);
        l.setOrderIndex(order);
        l.setDurationMinutes(duration);
        l.setContent(subtitleJson);
        return l;
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // VOCABULARY
    // ══════════════════════════════════════════════════════════════════════════════
    private void seedVocabulary(VocabularyRepository repo) {
        List<VocabularyWord> vocab = new ArrayList<>();
        vocab.addAll(vocabA1());
        vocab.addAll(vocabA2());
        vocab.addAll(vocabB1());
        vocab.addAll(vocabB2());
        repo.saveAll(vocab);
        log.info("  → Seeded {} vocabulary words", vocab.size());
    }

    private List<VocabularyWord> vocabA1() {
        return List.of(
            v("Hello", "/həˈloʊ/", "Xin chào", "A greeting used when meeting someone", "Hello, how are you?", "Xin chào, bạn khỏe không?", User.Level.A1, "greetings"),
            v("Goodbye", "/ɡʊdˈbaɪ/", "Tạm biệt", "Said when parting from someone", "Goodbye, see you tomorrow!", "Tạm biệt, hẹn gặp lại ngày mai!", User.Level.A1, "greetings"),
            v("Please", "/pliːz/", "Làm ơn / Xin vui lòng", "Used to make a polite request", "Please pass me the salt.", "Làm ơn đưa muối cho tôi.", User.Level.A1, "politeness"),
            v("Thank you", "/θæŋk juː/", "Cảm ơn", "Expressing gratitude", "Thank you for your help.", "Cảm ơn bạn đã giúp đỡ.", User.Level.A1, "politeness"),
            v("Water", "/ˈwɔːtər/", "Nước", "A clear liquid essential for life", "Can I have a glass of water?", "Tôi có thể xin một ly nước không?", User.Level.A1, "food"),
            v("Book", "/bʊk/", "Sách", "A written or printed work", "I am reading an interesting book.", "Tôi đang đọc một cuốn sách thú vị.", User.Level.A1, "objects"),
            v("Happy", "/ˈhæpi/", "Vui / Hạnh phúc", "Feeling or showing pleasure", "She looks very happy today.", "Cô ấy trông rất vui hôm nay.", User.Level.A1, "emotions"),
            v("Beautiful", "/ˈbjuːtɪfəl/", "Đẹp", "Pleasing to the senses", "The sunset is beautiful.", "Hoàng hôn thật đẹp.", User.Level.A1, "adjectives"),
            v("Apple", "/ˈæpəl/", "Quả táo", "A round fruit with red or green skin", "An apple a day keeps the doctor away.", "Một quả táo mỗi ngày tránh bác sĩ.", User.Level.A1, "food"),
            v("Cat", "/kæt/", "Con mèo", "A small domesticated feline", "The cat is sleeping on the sofa.", "Con mèo đang ngủ trên ghế sofa.", User.Level.A1, "animals"),
            v("Dog", "/dɒɡ/", "Con chó", "A domesticated canine companion", "My dog loves to play fetch.", "Con chó của tôi thích chơi đuổi bắt.", User.Level.A1, "animals"),
            v("Sun", "/sʌn/", "Mặt trời", "The star at the center of our solar system", "The sun rises in the east.", "Mặt trời mọc ở phía đông.", User.Level.A1, "nature"),
            v("Friend", "/frend/", "Bạn bè", "A person with whom one has mutual affection", "She is my best friend.", "Cô ấy là bạn thân của tôi.", User.Level.A1, "people"),
            v("Mother", "/ˈmʌðər/", "Mẹ", "A female parent", "My mother cooks breakfast every morning.", "Mẹ tôi nấu bữa sáng mỗi sáng.", User.Level.A1, "family"),
            v("Father", "/ˈfɑːðər/", "Bố / Cha", "A male parent", "My father works in an office.", "Bố tôi làm việc trong một văn phòng.", User.Level.A1, "family"),
            v("School", "/skuːl/", "Trường học", "An institution for educating children", "I walk to school every day.", "Tôi đi bộ đến trường mỗi ngày.", User.Level.A1, "places"),
            v("Teacher", "/ˈtiːtʃər/", "Giáo viên", "A person who teaches in a school", "Our teacher is very patient and kind.", "Giáo viên của chúng tôi rất kiên nhẫn và tốt bụng.", User.Level.A1, "people"),
            v("House", "/haʊs/", "Ngôi nhà", "A building for human habitation", "Their house has three bedrooms.", "Ngôi nhà của họ có ba phòng ngủ.", User.Level.A1, "places"),
            v("Car", "/kɑːr/", "Ô tô", "A four-wheeled motor vehicle", "He drives his car to work every morning.", "Anh ấy lái ô tô đi làm mỗi sáng.", User.Level.A1, "transportation"),
            v("Time", "/taɪm/", "Thời gian", "The indefinite continued progress of existence", "What time is it now?", "Bây giờ là mấy giờ rồi?", User.Level.A1, "abstract"),
            v("Day", "/deɪ/", "Ngày", "A period of twenty-four hours", "Today is a beautiful day.", "Hôm nay là một ngày đẹp trời.", User.Level.A1, "time"),
            v("Night", "/naɪt/", "Đêm", "The period between sunset and sunrise", "The stars are visible at night.", "Những ngôi sao có thể nhìn thấy vào ban đêm.", User.Level.A1, "time"),
            v("Food", "/fuːd/", "Thức ăn", "Nutritious substance eaten or drunk", "We grow our own food in the garden.", "Chúng tôi tự trồng thức ăn trong vườn.", User.Level.A1, "food"),
            v("Money", "/ˈmʌni/", "Tiền", "A current medium of exchange in coins and banknotes", "Do you have enough money for the ticket?", "Bạn có đủ tiền mua vé không?", User.Level.A1, "abstract"),
            v("Read", "/riːd/", "Đọc", "Look at and comprehend written or printed matter", "I like to read books before bed.", "Tôi thích đọc sách trước khi đi ngủ.", User.Level.A1, "verbs"),
            v("Write", "/raɪt/", "Viết", "Mark letters, words, or symbols on a surface", "Please write your name on the paper.", "Làm ơn viết tên của bạn lên giấy.", User.Level.A1, "verbs"),
            v("Run", "/rʌn/", "Chạy", "Move at a speed faster than a walk", "The children love to run in the park.", "Bọn trẻ thích chạy trong công viên.", User.Level.A1, "verbs"),
            v("Eat", "/iːt/", "Ăn", "Put food into the mouth and chew and swallow", "We eat dinner together as a family.", "Chúng tôi ăn tối cùng nhau như một gia đình.", User.Level.A1, "verbs"),
            v("Sleep", "/sliːp/", "Ngủ", "Rest by sleeping", "I usually sleep eight hours per night.", "Tôi thường ngủ tám tiếng mỗi đêm.", User.Level.A1, "verbs"),
            v("Play", "/pleɪ/", "Chơi", "Engage in activity for enjoyment", "The kids play in the garden every afternoon.", "Bọn trẻ chơi trong vườn mỗi buổi chiều.", User.Level.A1, "verbs")
        );
    }

    private List<VocabularyWord> vocabA2() {
        return List.of(
            v("Journey", "/ˈdʒɜːrni/", "Hành trình", "An act of traveling from one place to another", "The train journey took six hours.", "Chuyến đi tàu mất sáu tiếng.", User.Level.A2, "travel"),
            v("Discover", "/dɪˈskʌvər/", "Khám phá", "Find unexpectedly or in the course of travel", "We discovered a beautiful hidden beach.", "Chúng tôi khám phá một bãi biển ẩn giấu tuyệt đẹp.", User.Level.A2, "verbs"),
            v("Experience", "/ɪkˈspɪəriəns/", "Kinh nghiệm", "Practical contact with and observation of facts or events", "Living abroad was an incredible experience.", "Sống ở nước ngoài là một trải nghiệm không thể tin được.", User.Level.A2, "abstract"),
            v("Develop", "/dɪˈveləp/", "Phát triển", "Become larger or more mature", "The city has developed rapidly in recent years.", "Thành phố đã phát triển nhanh chóng trong những năm gần đây.", User.Level.A2, "verbs"),
            v("Environment", "/ɪnˈvaɪrənmənt/", "Môi trường", "The surroundings or conditions in which one lives", "We must protect the environment for future generations.", "Chúng ta phải bảo vệ môi trường cho các thế hệ tương lai.", User.Level.A2, "nature"),
            v("Restaurant", "/ˈrestərɒnt/", "Nhà hàng", "A place where people pay to eat meals", "Let us have dinner at that new Italian restaurant.", "Chúng ta ăn tối ở nhà hàng Ý mới đó nhé.", User.Level.A2, "places"),
            v("Airport", "/ˈeərpɔːrt/", "Sân bay", "A place where aircraft land and take off", "I arrived at the airport two hours early.", "Tôi đến sân bay sớm hai tiếng.", User.Level.A2, "places"),
            v("Hotel", "/hoʊˈtel/", "Khách sạn", "An establishment providing lodging and meals", "The hotel had a beautiful view of the ocean.", "Khách sạn có tầm nhìn đẹp ra đại dương.", User.Level.A2, "places"),
            v("Culture", "/ˈkʌltʃər/", "Văn hóa", "The arts and other manifestations of human intellectual achievement", "Vietnamese culture is very rich and diverse.", "Văn hóa Việt Nam rất phong phú và đa dạng.", User.Level.A2, "abstract"),
            v("Communicate", "/kəˈmjuːnɪkeɪt/", "Giao tiếp", "Share or exchange information", "It is important to communicate clearly with your team.", "Điều quan trọng là phải giao tiếp rõ ràng với nhóm của bạn.", User.Level.A2, "verbs"),
            v("Remember", "/rɪˈmembər/", "Nhớ", "Have in or be able to bring to one's mind", "I cannot remember where I put my keys.", "Tôi không nhớ đã để chìa khóa ở đâu.", User.Level.A2, "verbs"),
            v("Believe", "/bɪˈliːv/", "Tin / Tin tưởng", "Accept as true", "I believe you can achieve your goals.", "Tôi tin rằng bạn có thể đạt được mục tiêu của mình.", User.Level.A2, "verbs"),
            v("Decision", "/dɪˈsɪʒən/", "Quyết định", "A conclusion reached after consideration", "Making the right decision took a lot of thought.", "Đưa ra quyết định đúng cần rất nhiều suy nghĩ.", User.Level.A2, "abstract"),
            v("Adventure", "/ədˈventʃər/", "Cuộc phiêu lưu", "An unusual and exciting experience", "Traveling alone was the adventure of a lifetime.", "Du lịch một mình là cuộc phiêu lưu một đời người.", User.Level.A2, "travel"),
            v("Traditional", "/trəˈdɪʃənəl/", "Truyền thống", "Existing in or as part of tradition", "She prefers traditional clothing to modern fashion.", "Cô ấy thích quần áo truyền thống hơn thời trang hiện đại.", User.Level.A2, "adjectives")
        );
    }

    private List<VocabularyWord> vocabB1() {
        return List.of(
            v("Sustainability", "/səˌsteɪnəˈbɪləti/", "Tính bền vững", "The ability to be maintained at a certain rate or level", "Sustainability is crucial for protecting our planet.", "Tính bền vững rất quan trọng để bảo vệ hành tinh của chúng ta.", User.Level.B1, "environment"),
            v("Remote", "/rɪˈmoʊt/", "Từ xa / Việc từ xa", "Situated far away; relating to work from home", "Many companies now offer remote work options.", "Nhiều công ty hiện nay cung cấp tùy chọn làm việc từ xa.", User.Level.B1, "work"),
            v("Negotiate", "/nɪˈɡoʊʃieɪt/", "Đàm phán", "Try to reach an agreement through discussion", "We need to negotiate better terms with our supplier.", "Chúng ta cần đàm phán các điều khoản tốt hơn với nhà cung cấp.", User.Level.B1, "work"),
            v("Collaborate", "/kəˈlæbəreɪt/", "Cộng tác", "Work jointly on an activity", "Teams that collaborate effectively achieve better results.", "Các nhóm cộng tác hiệu quả đạt được kết quả tốt hơn.", User.Level.B1, "work"),
            v("Argument", "/ˈɑːrɡjumənt/", "Lập luận", "An exchange of diverging views", "She presented a compelling argument for the new policy.", "Cô ấy trình bày một lập luận thuyết phục cho chính sách mới.", User.Level.B1, "communication"),
            v("Persuade", "/pərˈsweɪd/", "Thuyết phục", "Convince someone to do or believe something", "It was difficult to persuade management to change the plan.", "Thật khó để thuyết phục ban lãnh đạo thay đổi kế hoạch.", User.Level.B1, "communication"),
            v("Technology", "/tekˈnɒlədʒi/", "Công nghệ", "The application of scientific knowledge for practical purposes", "Technology has transformed the way we communicate.", "Công nghệ đã thay đổi cách chúng ta giao tiếp.", User.Level.B1, "science"),
            v("Influence", "/ˈɪnfluəns/", "Ảnh hưởng", "The capacity to affect people or things", "Social media has a huge influence on young people.", "Mạng xã hội có ảnh hưởng rất lớn đến người trẻ.", User.Level.B1, "abstract"),
            v("Opportunity", "/ˌɒpərˈtjuːnəti/", "Cơ hội", "A set of circumstances that makes it possible to do something", "This is a great opportunity to learn new skills.", "Đây là một cơ hội tuyệt vời để học những kỹ năng mới.", User.Level.B1, "abstract"),
            v("Research", "/rɪˈsɜːrtʃ/", "Nghiên cứu", "Systematic investigation into and study of materials and sources", "The research shows a clear link between exercise and health.", "Nghiên cứu cho thấy mối liên hệ rõ ràng giữa tập thể dục và sức khỏe.", User.Level.B1, "science"),
            v("Knowledge", "/ˈnɒlɪdʒ/", "Kiến thức", "Facts, information, and skills acquired through experience or education", "Knowledge is more valuable than wealth.", "Kiến thức quý giá hơn cả của cải.", User.Level.B1, "abstract"),
            v("Challenge", "/ˈtʃælɪndʒ/", "Thử thách", "A task or situation that tests someone's abilities", "Learning a new language is a rewarding challenge.", "Học một ngôn ngữ mới là một thử thách đáng giá.", User.Level.B1, "abstract"),
            v("Achievement", "/əˈtʃiːvmənt/", "Thành tựu", "A thing that someone has accomplished", "Getting into university was her greatest achievement.", "Vào đại học là thành tựu lớn nhất của cô ấy.", User.Level.B1, "abstract"),
            v("Environment", "/ɪnˈvaɪrənmənt/", "Môi trường", "The surroundings or conditions in which one lives", "Climate change affects the global environment.", "Biến đổi khí hậu ảnh hưởng đến môi trường toàn cầu.", User.Level.B1, "environment"),
            v("Accomplish", "/əˈkʌmplɪʃ/", "Hoàn thành", "Achieve or complete successfully", "With hard work, you can accomplish any goal.", "Với sự chăm chỉ, bạn có thể hoàn thành bất kỳ mục tiêu nào.", User.Level.B1, "verbs")
        );
    }

    private List<VocabularyWord> vocabB2() {
        return List.of(
            v("Paradigm", "/ˈpærədaɪm/", "Mô hình / Paradigm", "A typical example or pattern of something", "This discovery represents a paradigm shift in our understanding.", "Phát hiện này đại diện cho một bước ngoặt trong hiểu biết của chúng ta.", User.Level.B2, "abstract"),
            v("Hypothesis", "/haɪˈpɒθəsɪs/", "Giả thuyết", "A proposed explanation based on limited evidence", "The scientist tested her hypothesis through experiments.", "Nhà khoa học đã kiểm tra giả thuyết của cô ấy qua các thí nghiệm.", User.Level.B2, "science"),
            v("Discourse", "/ˈdɪskɔːrs/", "Diễn ngôn / Bài phát biểu", "Written or spoken communication", "The professor delivered an inspiring discourse on philosophy.", "Giáo sư trình bày một bài diễn ngôn truyền cảm hứng về triết học.", User.Level.B2, "communication"),
            v("Pragmatic", "/præɡˈmætɪk/", "Thực dụng", "Dealing with things sensibly and realistically", "We need a pragmatic approach to solve this problem.", "Chúng ta cần một cách tiếp cận thực dụng để giải quyết vấn đề này.", User.Level.B2, "adjectives"),
            v("Synthesize", "/ˈsɪnθəsaɪz/", "Tổng hợp", "Combine elements into a coherent whole", "The researcher synthesized data from multiple studies.", "Nhà nghiên cứu tổng hợp dữ liệu từ nhiều nghiên cứu.", User.Level.B2, "verbs"),
            v("Perspective", "/pərˈspektɪv/", "Quan điểm", "A particular way of viewing things", "It is important to consider other perspectives.", "Điều quan trọng là phải xem xét các quan điểm khác.", User.Level.B2, "abstract"),
            v("Comprehensive", "/ˌkɒmprɪˈhensɪv/", "Toàn diện", "Complete and thorough", "The report provides a comprehensive analysis of the market.", "Báo cáo cung cấp một phân tích toàn diện về thị trường.", User.Level.B2, "adjectives"),
            v("Momentum", "/moʊˈmentəm/", "Đà / Momentum", "The force or speed of movement", "The company gained momentum after the product launch.", "Công ty có đà sau khi ra mắt sản phẩm.", User.Level.B2, "abstract"),
            v("Cultivate", "/ˈkʌltɪveɪt/", "Vun trồng / Phát triển", "Try to acquire or develop a quality", "Reading regularly helps cultivate critical thinking.", "Đọc sách thường xuyên giúp phát triển tư duy phản biện.", User.Level.B2, "verbs"),
            v("Proficiency", "/prəˈfɪʃənsi/", "Thành thạo", "A high degree of skill", "Proficiency in multiple languages is highly valued in business.", "Thành thạo nhiều ngôn ngữ rất được coi trọng trong kinh doanh.", User.Level.B2, "abstract")
        );
    }

    private VocabularyWord v(String word, String pron, String trans, String def,
                           String ex, String exTrans, User.Level level, String cat) {
        VocabularyWord w = new VocabularyWord();
        w.setWord(word);
        w.setPronunciation(pron);
        w.setTranslation(trans);
        w.setDefinition(def);
        w.setExample(ex);
        w.setExampleTranslation(exTrans);
        w.setLevel(level);
        w.setCategory(cat);
        return w;
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // EXERCISES
    // ══════════════════════════════════════════════════════════════════════════════
    private void seedExercises(ExerciseRepository exerciseRepo,
                               ExerciseQuestionRepository questionRepo,
                               ObjectMapper objectMapper) {
        List<Exercise> exercises = List.of(
            mkExercise("Vocabulary: Greetings & Introductions",
                    "Practice basic greeting vocabulary",
                    Exercise.ExerciseType.VOCAB_QUIZ, User.Level.A1, "greetings",
                    "Match each word with its meaning. Choose the correct answer for each question.",
                    10, 1),
            mkExercise("Grammar: Present Simple Tense",
                    "Form correct sentences using present simple",
                    Exercise.ExerciseType.GRAMMAR, User.Level.A1, "grammar",
                    "Complete each sentence with the correct form of the verb.",
                    10, 1),
            mkExercise("Listening: At the Restaurant",
                    "Listen and understand common restaurant phrases",
                    Exercise.ExerciseType.LISTENING, User.Level.A1, "listening",
                    "Listen to the dialogue and answer the questions.",
                    10, 1),
            mkExercise("Reading: My Family",
                    "Read the short passage about a family",
                    Exercise.ExerciseType.READING, User.Level.A1, "reading",
                    "Read the passage carefully and answer the questions.",
                    10, 1),
            mkExercise("Vocabulary: A2 - Travel & Direction",
                    "Master travel vocabulary and direction words",
                    Exercise.ExerciseType.VOCAB_QUIZ, User.Level.A2, "travel",
                    "Choose the correct word to complete each sentence.",
                    10, 1),
            mkExercise("Grammar: Past Tense",
                    "Practice past simple and past continuous",
                    Exercise.ExerciseType.GRAMMAR, User.Level.A2, "grammar",
                    "Fill in the blanks with the correct past tense form.",
                    10, 1),
            mkExercise("Grammar: Conditionals",
                    "Understand and use if-clauses",
                    Exercise.ExerciseType.GRAMMAR, User.Level.B1, "conditionals",
                    "Complete the conditional sentences correctly.",
                    10, 1),
            mkExercise("Business: Email Writing",
                    "Write professional emails",
                    Exercise.ExerciseType.WRITING, User.Level.B2, "business",
                    "Write a professional email based on the situation described.",
                    15, 2)
        );

        for (Exercise ex : exercises) {
            exerciseRepo.save(ex);
        }

        // Seed questions for each exercise
        seedQuestionsForExercise("Vocabulary: Greetings & Introductions", questionRepo,
                List.of(
                    q("What does 'Hello' mean?", List.of("Xin chào", "Tạm biệt", "Cảm ơn", "Xin lỗi"), 0),
                    q("How do you say 'goodbye' in English?", List.of("Hello", "Goodbye", "Please", "Thank you"), 1),
                    q("Which is a polite word?", List.of("Dog", "Table", "Please", "Book"), 2),
                    q("'Thank you' means:", List.of("Xin chào", "Tạm biệt", "Cảm ơn", "Xin lỗi"), 2),
                    q("Choose the correct greeting:", List.of("Good night", "Good morning", "Run", "Eat"), 1),
                    q("'Sorry' is used to:", List.of("Greet someone", "Express gratitude", "Apologize", "Ask a question"), 2),
                    q("What do you say when leaving?", List.of("Hello", "Thank you", "Goodbye", "Please"), 2),
                    q("'Welcome' is used when:", List.of("Leaving", "Someone arrives", "Being rude", "Refusing"), 1),
                    q("Which phrase means 'how are you'?", List.of("What is your name", "How are you", "Where are you", "Who are you"), 1),
                    q("'Nice to meet you' is said when:", List.of("Leaving", "Meeting someone new", "Apologizing", "Asking for help"), 1)
                ), objectMapper);

        seedQuestionsForExercise("Grammar: Present Simple Tense", questionRepo,
                List.of(
                    q("Choose the correct sentence:", List.of("I am happy", "I is happy", "I are happy", "I be happy"), 0),
                    q("'She ___ a student.' Choose the correct verb:", List.of("is", "are", "am", "be"), 0),
                    q("Complete: 'This ___ my book.'", List.of("is", "are", "am", "be"), 0),
                    q("Which is a proper question?", List.of("You are okay", "Are you okay?", "You are okay?", "Are you okay"), 1),
                    q("Choose the correct negative:", List.of("I not like", "I no like", "I do not like", "I not like it"), 2),
                    q("'I have ___ apple.' Choose the correct article:", List.of("a", "an", "the", "some"), 1),
                    q("Which word is a verb?", List.of("Happy", "Beautiful", "Run", "Cat"), 2),
                    q("Choose the correct plural:", List.of("Childs", "Children", "Childrens", "Child"), 1),
                    q("'He ___ to school every day.' Choose:", List.of("go", "goes", "going", "went"), 1),
                    q("Which sentence is correct?", List.of("I like cats", "I likes cats", "I liking cats", "I liked cats"), 0)
                ), objectMapper);

        seedQuestionsForExercise("Vocabulary: A2 - Travel & Direction", questionRepo,
                List.of(
                    q("'Journey' means:", List.of("A book", "Travel from one place to another", "A type of food", "A building"), 1),
                    q("What is the opposite of 'arrival'?", List.of("Departure", "Hotel", "Airport", "Ticket"), 0),
                    q("'Discover' means:", List.of("Hide something", "Find something new", "Forget something", "Destroy something"), 1),
                    q("Which word means 'to communicate'?", List.of("Isolate", "Express ideas", "Ignore", "Separate"), 1),
                    q("'Restaurant' is a place where you:", List.of("Sleep", "Eat meals", "Study", "Work"), 1),
                    q("Choose the correct meaning of 'develop':", List.of("Destroy", "Make smaller", "Grow or improve", "Keep the same"), 2),
                    q("'Experience' can be:", List.of("Only negative", "An unusual event or activity", "Only at school", "Only for children"), 1),
                    q("Which word means 'the surroundings'?", List.of("Environment", "Adventure", "Culture", "Restaurant"), 0),
                    q("'Remember' is the opposite of:", List.of("Recall", "Know", "Forget", "Think"), 2),
                    q("'Decision' means:", List.of("A question", "A conclusion after thinking", "A wish", "A prediction"), 1)
                ), objectMapper);

        log.info("  → Seeded {} exercises with questions", exerciseRepo.count());
    }

    private Exercise mkExercise(String title, String desc, Exercise.ExerciseType type,
                               User.Level level, String topic, String instructions,
                               int duration, int maxScore) {
        Exercise ex = new Exercise();
        ex.setTitle(title);
        ex.setDescription(desc);
        ex.setType(type);
        ex.setLevel(level);
        ex.setTopic(topic);
        ex.setInstructions(instructions);
        ex.setDurationMinutes(duration);
        ex.setMaxScore(maxScore);
        ex.setActive(true);
        return ex;
    }

    private void seedQuestionsForExercise(String exerciseTitle,
                                          ExerciseQuestionRepository questionRepo,
                                          List<Map<String, Object>> questions,
                                          ObjectMapper objectMapper) {
        List<Exercise> all = new java.util.ArrayList<>();
        exerciseRepository.findAll().forEach(all::add);
        Exercise ex = all.stream()
                .filter(e -> e.getTitle().equals(exerciseTitle))
                .findFirst()
                .orElse(null);
        if (ex == null) return;

        for (int i = 0; i < questions.size(); i++) {
            Map<String, Object> q = questions.get(i);
            ExerciseQuestion eq = new ExerciseQuestion();
            eq.setExerciseId(ex.getId());
            eq.setQuestion((String) q.get("question"));
            eq.setType(ExerciseQuestion.QuestionType.MULTIPLE_CHOICE);
            eq.setOptions(toJson(q.get("options"), objectMapper));
            eq.setCorrectAnswer(String.valueOf(q.get("correct")));
            eq.setOrderIndex(i);
            eq.setPoints(1);
            questionRepo.save(eq);
        }
    }

    @SuppressWarnings("unchecked")
    private String toJson(Object obj, ObjectMapper mapper) {
        try { return mapper.writeValueAsString(obj); }
        catch (Exception e) { return "[]"; }
    }

    private Map<String, Object> q(String question, List<String> options, int correct) {
        return new java.util.LinkedHashMap<>() {{
            put("question", question);
            put("options", options);
            put("correct", correct);
        }};
    }

    // Inject repositories for use in lambdas
    private final ExerciseRepository exerciseRepository;
    private final LessonRepository lessonRepository;

    public DataInitializer(ExerciseRepository exerciseRepository, LessonRepository lessonRepository) {
        this.exerciseRepository = exerciseRepository;
        this.lessonRepository = lessonRepository;
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // TESTS
    // ══════════════════════════════════════════════════════════════════════════════
    private void seedTests(TestRepository testRepo, ObjectMapper objectMapper) {
        testRepo.saveAll(List.of(
            mkTest("A1 Vocabulary Final Test",
                    "Comprehensive vocabulary test for level A1 learners",
                    Test.TestType.VOCAB_QUIZ, User.Level.A1, "general",
                    15, 10, 10, true,
                    List.of(
                        tq("What is 'beautiful' in Vietnamese?", List.of("Buồn", "Đẹp", "Xấu", "Lớn"), 1),
                        tq("Choose the correct greeting:", List.of("Good night", "Good morning", "Run", "Eat"), 1),
                        tq("'Thank you' means:", List.of("Xin chào", "Tạm biệt", "Cảm ơn", "Xin lỗi"), 2),
                        tq("What does 'Sun' mean?", List.of("Mặt trăng", "Mặt trời", "Sao", "Ngôi nhà"), 1),
                        tq("'Friend' means:", List.of("Kẻ thù", "Bạn bè", "Gia đình", "Thầy cô"), 1),
                        tq("'Happy' means:", List.of("Buồn", "Tức giận", "Vui / Hạnh phúc", "Sợ hãi"), 2),
                        tq("What is 'Apple' in Vietnamese?", List.of("Chuối", "Cam", "Táo", "Nho"), 2),
                        tq("'Please' can be translated as:", List.of("Cảm ơn", "Xin lỗi", "Làm ơn / Xin vui lòng", "Tạm biệt"), 2),
                        tq("How do you spell the word meaning 'nước'?", List.of("Watter", "Water", "Weter", "Watir"), 1),
                        tq("Which is an animal?", List.of("Book", "Water", "Dog", "House"), 2)
                    ), objectMapper),
            mkTest("A2 Grammar Test",
                    "Test your understanding of A2 level grammar structures",
                    Test.TestType.GRAMMAR, User.Level.A2, "grammar",
                    20, 12, 10, true,
                    List.of(
                        tq("Complete: 'She ___ to the market yesterday.'", List.of("go", "goes", "went", "going"), 2),
                        tq("'If it rains, I ___ stay home.' Choose:", List.of("will", "would", "can", "must"), 0),
                        tq("Which sentence uses the past continuous correctly?", List.of("I was reading when she called.", "I were reading", "I am reading yesterday", "I read now"), 0),
                        tq("Choose the correct tag question:", List.of("You are coming, are you?", "You are coming, aren't you?", "You are coming?", "You coming?"), 1),
                        tq("'Discover' means:", List.of("Hide", "Find something new", "Destroy", "Forget"), 1),
                        tq("Which word means 'to communicate'?", List.of("Isolate", "Express ideas", "Ignore", "Separate"), 1),
                        tq("'Restaurant' is a place where you:", List.of("Sleep", "Eat meals", "Study", "Work"), 1),
                        tq("Choose the correct meaning of 'develop':", List.of("Destroy", "Make smaller", "Grow or improve", "Keep the same"), 2),
                        tq("'Experience' can be:", List.of("Only negative", "An unusual event", "Only at school", "Only for children"), 1),
                        tq("Which word means 'the surroundings'?", List.of("Environment", "Adventure", "Culture", "Restaurant"), 0)
                    ), objectMapper),
            mkTest("B1 Grammar & Vocabulary Test",
                    "Comprehensive test covering B1 grammar and vocabulary",
                    Test.TestType.MIXED, User.Level.B1, "mixed",
                    25, 15, 10, true,
                    List.of(
                        tq("'If I ___ more time, I would learn another language.'", List.of("have", "had", "have had", "has"), 1),
                        tq("Choose the correct passive: 'Someone cleaned the house.'", List.of("The house was cleaned.", "The house is cleaning.", "The house cleaned.", "Cleaning the house."), 0),
                        tq("'He said that he ___ tired.'", List.of("is", "was", "were", "be"), 1),
                        tq("'Knowledge' is most similar to:", List.of("Money", "Facts and understanding", "Power", "Luck"), 1),
                        tq("Which word means 'an unusual and exciting experience'?", List.of("Adventure", "Routine", "Boredom", "Mistake"), 0),
                        tq("'Negotiate' means:", List.of("Argue", "Discuss to reach agreement", "Refuse", "Quit"), 1),
                        tq("Choose the correct conditional:", List.of("If water boils, it freeze.", "If water freeze, it boils.", "If water boils, it freezes.", "Water if boils freezes."), 2),
                        tq("'Technology has transformed ___ lives.'", List.of("us", "our", "ours", "we"), 1),
                        tq("Which is a collocation: 'make ___'?", List.of("a decision", "a problem", "a house", "a car"), 0),
                        tq("'The research shows a ___ between exercise and health.'", List.of("link", "break", "start", "end"), 0)
                    ), objectMapper),
            mkTest("Placement Test: Determine Your Level",
                    "Quick assessment to find your current English level",
                    Test.TestType.PLACEMENT, User.Level.A1, "placement",
                    10, 6, 10, false,
                    List.of(
                        tq("What is the English for 'Xin chào'?", List.of("Goodbye", "Hello", "Sorry", "Thank you"), 1),
                        tq("Which word means 'đẹp'?", List.of("Happy", "Beautiful", "Sad", "Angry"), 1),
                        tq("Complete: 'The ___ is shining.'", List.of("Moon", "Star", "Sun", "Sky"), 2),
                        tq("What color is the sky?", List.of("Red", "Blue", "Green", "Yellow"), 1),
                        tq("'Dog' in Vietnamese is:", List.of("Mèo", "Chim", "Chó", "Cá"), 2),
                        tq("Choose the correct greeting:", List.of("Good night", "Good morning", "Goodbye", "Sorry"), 1),
                        tq("'Please' means:", List.of("Cảm ơn", "Xin lỗi", "Làm ơn", "Tạm biệt"), 2),
                        tq("Which is an animal?", List.of("Book", "Water", "Dog", "House"), 2)
                    ), objectMapper)
        ));
        log.info("  → Seeded {} tests", testRepo.count());
    }

    private Test mkTest(String title, String desc, Test.TestType type, User.Level level,
                        String category, int duration, int passingScore, int maxScore,
                        boolean timed, List<Map<String, Object>> questions,
                        ObjectMapper objectMapper) {
        Test t = new Test();
        t.setTitle(title);
        t.setDescription(desc);
        t.setType(type);
        t.setLevel(level);
        t.setCategory(category);
        t.setDurationMinutes(duration);
        t.setPassingScore(passingScore);
        t.setMaxScore(maxScore);
        t.setTotalQuestions(questions.size());
        t.setTimed(timed);
        t.setActive(true);
        try {
            t.setQuestionData(objectMapper.writeValueAsString(questions));
        } catch (Exception e) {
            t.setQuestionData("[]");
        }
        return t;
    }

    private Map<String, Object> tq(String question, List<String> options, int correct) {
        return new java.util.LinkedHashMap<>() {{
            put("question", question);
            put("options", options);
            put("correctAnswer", String.valueOf(correct));
            put("points", 1);
        }};
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // USER PROGRESS & QUIZ RESULTS
    // ══════════════════════════════════════════════════════════════════════════════
    private void seedUserProgress(UserProgressRepository progressRepo,
                                  QuizResultRepository quizRepo,
                                  UserRepository userRepo,
                                  CourseRepository courseRepo,
                                  LessonRepository lessonRepo) {
        List<User> students = userRepo.findByRole(User.Role.STUDENT);
        List<Course> courses = courseRepo.findAll();
        List<Lesson> lessons = lessonRepo.findAll();

        if (students.isEmpty() || lessons.isEmpty()) return;

        User s1 = students.get(0); // Minh Tuấn - A1, very active
        User s2 = students.size() > 1 ? students.get(1) : s1; // Hồng Linh - A2
        User s3 = students.size() > 2 ? students.get(2) : s1; // David Chen - B1
        User s4 = students.size() > 3 ? students.get(3) : s1; // Emma - B2

        // Student 1 (Minh Tuấn) - completed 5 A1 lessons
        List<Lesson> a1Lessons = lessons.stream()
                .filter(l -> {
                    Course c = courses.stream().filter(cn -> cn.getId().equals(l.getCourseId())).findFirst().orElse(null);
                    return c != null && c.getLevel() == User.Level.A1;
                })
                .sorted(Comparator.comparingInt(Lesson::getOrderIndex))
                .toList();

        int completed1 = 0;
        for (Lesson lesson : a1Lessons) {
            if (completed1 >= 5) break;
            UserProgress p = new UserProgress();
            p.setUserId(s1.getId());
            p.setLessonId(lesson.getId());
            p.setCourseId(lesson.getCourseId());
            p.setCompleted(true);
            p.setScore(80 + (int)(Math.random() * 20));
            p.setTimeSpentMinutes(lesson.getDurationMinutes() + (int)(Math.random() * 10));
            p.setCompletedAt(LocalDateTime.now().minusDays(5 - completed1));
            progressRepo.save(p);

            QuizResult qr = new QuizResult();
            qr.setUserId(s1.getId());
            qr.setLessonId(lesson.getId());
            qr.setCourseId(lesson.getCourseId());
            qr.setTotalQuestions(10);
            qr.setCorrectAnswers((int)(p.getScore() / 10));
            qr.setScore(p.getScore());
            qr.setQuizType("LESSON");
            qr.setCompletedAt(LocalDateTime.now().minusDays(5 - completed1));
            quizRepo.save(qr);
            completed1++;
        }

        // Student 2 (Hồng Linh) - completed 3 A2 lessons
        List<Lesson> a2Lessons = lessons.stream()
                .filter(l -> {
                    Course c = courses.stream().filter(cn -> cn.getId().equals(l.getCourseId())).findFirst().orElse(null);
                    return c != null && c.getLevel() == User.Level.A2;
                })
                .sorted(Comparator.comparingInt(Lesson::getOrderIndex))
                .toList();

        int completed2 = 0;
        for (Lesson lesson : a2Lessons) {
            if (completed2 >= 3) break;
            UserProgress p = new UserProgress();
            p.setUserId(s2.getId());
            p.setLessonId(lesson.getId());
            p.setCourseId(lesson.getCourseId());
            p.setCompleted(true);
            p.setScore(75 + (int)(Math.random() * 20));
            p.setTimeSpentMinutes(lesson.getDurationMinutes() + (int)(Math.random() * 8));
            p.setCompletedAt(LocalDateTime.now().minusDays(3 - completed2));
            progressRepo.save(p);
            completed2++;
        }

        // Student 3 (David Chen) - completed 2 B1 lessons, 1 in progress
        List<Lesson> b1Lessons = lessons.stream()
                .filter(l -> {
                    Course c = courses.stream().filter(cn -> cn.getId().equals(l.getCourseId())).findFirst().orElse(null);
                    return c != null && c.getLevel() == User.Level.B1;
                })
                .sorted(Comparator.comparingInt(Lesson::getOrderIndex))
                .toList();

        int completed3 = 0;
        for (Lesson lesson : b1Lessons) {
            if (completed3 >= 3) break;
            UserProgress p = new UserProgress();
            p.setUserId(s3.getId());
            p.setLessonId(lesson.getId());
            p.setCourseId(lesson.getCourseId());
            p.setCompleted(completed3 < 2);
            p.setScore(completed3 < 2 ? (85 + (int)(Math.random() * 15)) : 0);
            p.setTimeSpentMinutes(completed3 < 2 ? (lesson.getDurationMinutes() + (int)(Math.random() * 10)) : 5);
            if (completed3 < 2) p.setCompletedAt(LocalDateTime.now().minusDays(2 - completed3));
            progressRepo.save(p);
            completed3++;
        }

        log.info("  → Seeded {} user progress records and {} quiz results",
                progressRepo.count(), quizRepo.count());
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // TEST RESULTS
    // ══════════════════════════════════════════════════════════════════════════════
    private void seedTestResults(TestResultRepository resultRepo,
                                 TestSessionRepository sessionRepo,
                                 TestRepository testRepo,
                                 UserRepository userRepo) {
        List<User> students = userRepo.findByRole(User.Role.STUDENT);
        List<Test> tests = testRepo.findAll();
        if (students.isEmpty() || tests.isEmpty()) return;

        int[][] scoreMatrix = {
            {85, 78, 72, 90, 65, 80, 88, 75},  // Student 1: various scores
            {92, 85, 80, 88, 91, 87, 83, 89},  // Student 2: strong student
            {60, 55, 70, 62, 58, 65, 68, 72},  // Student 3: improving
            {78, 82, 75, 80, 77, 85, 79, 83}   // Student 4: consistent
        };

        int[] times = {720, 960, 840, 1080, 660, 900, 780, 1200};

        for (int si = 0; si < Math.min(students.size(), 4); si++) {
            User student = students.get(si);
            for (int ti = 0; ti < Math.min(tests.size(), 8); ti++) {
                Test test = tests.get(ti % tests.size());

                // Test Session
                TestSession session = new TestSession();
                session.setUserId(student.getId());
                session.setTestId(test.getId());
                session.setTestTitle(test.getTitle());
                session.setTestType(test.getType().name());
                session.setStartedAt(LocalDateTime.now().minusDays((4 - si) * 3 + ti));
                session.setSubmittedAt(session.getStartedAt().plusSeconds(times[ti]));
                session.setTotalTimeSeconds(times[ti]);
                session.setQuestionsCount(test.getTotalQuestions());
                session.setStatus(TestSession.TestStatus.SUBMITTED);
                session = sessionRepo.save(session);

                // Test Result
                int score = scoreMatrix[si][ti];
                TestResult result = new TestResult();
                result.setUserId(student.getId());
                result.setTestSessionId(session.getId());
                result.setTestId(test.getId());
                result.setTestTitle(test.getTitle());
                result.setTestType(test.getType().name());
                result.setLevel(test.getLevel().name());
                result.setTotalQuestions(test.getTotalQuestions());
                result.setCorrectAnswers((int) Math.round(score / 10.0));
                result.setScore(score / 10.0);
                result.setPercentage(String.valueOf(Math.round(score)));
                result.setTimeSpentSeconds(times[ti]);
                result.setCompletedAt(session.getSubmittedAt());
                resultRepo.save(result);
            }
        }

        log.info("  → Seeded {} test sessions and {} test results",
                sessionRepo.count(), resultRepo.count());
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // BADGES
    // ══════════════════════════════════════════════════════════════════════════════
    private void seedBadges(UserBadgeRepository repo, UserRepository userRepo) {
        List<User> students = userRepo.findByRole(User.Role.STUDENT);

        List<UserBadge> badges = List.of(
            mkBadge(students, "first_lesson", "First Step", "Complete your first lesson", "🎯", "common"),
            mkBadge(students, "vocab_10", "Word Collector", "Save 10 vocabulary words", "📚", "common"),
            mkBadge(students, "streak_3", "On Fire", "Maintain a 3-day learning streak", "🔥", "common"),
            mkBadge(students, "streak_7", "Week Warrior", "Maintain a 7-day learning streak", "💪", "rare"),
            mkBadge(students, "perfect_score", "Perfect Score", "Get 100% on any test", "🏆", "rare"),
            mkBadge(students, "course_complete", "Graduate", "Complete an entire course", "🎓", "rare"),
            mkBadge(students, "forum_helper", "Forum Helper", "Help 5 students in the forum", "💬", "epic"),
            mkBadge(students, "vocab_master", "Vocabulary Master", "Learn 100 words", "🧠", "epic"),
            mkBadge(students, "level_up", "Level Up!", "Reach a new CEFR level", "⬆️", "rare"),
            mkBadge(students, "early_bird", "Early Bird", "Study before 7 AM", "🌅", "common"),
            mkBadge(students, "speed_demon", "Speed Demon", "Complete a test in under 5 minutes", "⚡", "epic"),
            mkBadge(students, "social_learner", "Social Learner", "Invite 3 friends to the platform", "👥", "rare")
        );

        for (UserBadge badge : badges) {
            repo.save(badge);
        }
        log.info("  → Seeded {} badges", repo.count());
    }

    private UserBadge mkBadge(List<User> students, String badgeId, String name, String desc,
                              String icon, String rarity) {
        UserBadge badge = new UserBadge();
        badge.setBadgeId(badgeId);
        badge.setBadgeName(name);
        badge.setBadgeDescription(desc);
        badge.setIcon(icon);
        badge.setRarity(rarity);
        // Assign to first 3 students
        if (students.size() > 0) badge.setUserId(students.get(0).getId());
        return badge;
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // DAILY CHALLENGES
    // ══════════════════════════════════════════════════════════════════════════════
    private void seedDailyChallenges(DailyChallengeRepository dailyRepo,
                                    UserChallengeRepository ucRepo,
                                    UserRepository userRepo) {
        List<User> students = userRepo.findByRole(User.Role.STUDENT);

        List<DailyChallenge> challenges = List.of(
            mkDailyChallenge(LocalDate.now(), DailyChallenge.ChallengeType.VOCAB_QUIZ,
                    "Vocabulary Blitz", "Match 10 words with their meanings in 5 minutes!", 50, 10, "MEDIUM"),
            mkDailyChallenge(LocalDate.now().minusDays(1), DailyChallenge.ChallengeType.LISTENING,
                    "Listening Challenge", "Listen to a short dialogue and answer 5 questions.", 40, 5, "EASY"),
            mkDailyChallenge(LocalDate.now().minusDays(2), DailyChallenge.ChallengeType.GRAMMAR_SPRINT,
                    "Grammar Sprint", "Complete 15 grammar questions as fast as you can.", 60, 15, "HARD"),
            mkDailyChallenge(LocalDate.now().minusDays(3), DailyChallenge.ChallengeType.MIXED,
                    "Mixed Challenge", "A variety of vocabulary, grammar, and reading questions.", 55, 12, "MEDIUM"),
            mkDailyChallenge(LocalDate.now().minusDays(4), DailyChallenge.ChallengeType.READING_SPEED,
                    "Speed Reading", "Read 3 passages and answer 8 comprehension questions.", 45, 8, "MEDIUM"),
            mkDailyChallenge(LocalDate.now().minusDays(5), DailyChallenge.ChallengeType.SPEAKING_SHADOWING,
                    "Speaking Shadowing", "Listen and repeat 10 phrases for pronunciation practice.", 35, 10, "EASY"),
            mkDailyChallenge(LocalDate.now().minusDays(6), DailyChallenge.ChallengeType.VOCAB_QUIZ,
                    "Word of the Day", "Learn and remember 8 new vocabulary words.", 40, 8, "EASY")
        );

        for (DailyChallenge dc : challenges) {
            dailyRepo.save(dc);
        }

        // Assign some completed challenges to students
        if (!students.isEmpty() && !challenges.isEmpty()) {
            User s1 = students.get(0);
            // Student 1 completed 5 challenges
            for (int i = 0; i < Math.min(5, challenges.size()); i++) {
                DailyChallenge dc = challenges.get(i);
                UserChallenge uc = new UserChallenge();
                uc.setUserId(s1.getId());
                uc.setChallengeId(dc.getId());
                uc.setProgress(100);
                uc.setCompleted(true);
                uc.setXpEarned(dc.getXpReward());
                uc.setCompletedAt(LocalDateTime.now().minusDays(i));
                ucRepo.save(uc);
            }

            // Student 2 completed 3 challenges
            if (students.size() > 1) {
                User s2 = students.get(1);
                for (int i = 0; i < Math.min(3, challenges.size()); i++) {
                    DailyChallenge dc = challenges.get(i);
                    UserChallenge uc = new UserChallenge();
                    uc.setUserId(s2.getId());
                    uc.setChallengeId(dc.getId());
                    uc.setProgress(100);
                    uc.setCompleted(true);
                    uc.setXpEarned(dc.getXpReward());
                    uc.setCompletedAt(LocalDateTime.now().minusDays(i + 1));
                    ucRepo.save(uc);
                }
            }
        }

        log.info("  → Seeded {} daily challenges and {} user challenge records",
                dailyRepo.count(), ucRepo.count());
    }

    private DailyChallenge mkDailyChallenge(LocalDate date, DailyChallenge.ChallengeType type,
                                             String title, String desc,
                                             int xp, int target, String difficulty) {
        DailyChallenge dc = new DailyChallenge();
        dc.setChallengeDate(date);
        dc.setType(type);
        dc.setTitle(title);
        dc.setDescription(desc);
        dc.setXpReward(xp);
        dc.setTargetGoal(target);
        dc.setDifficulty(difficulty);
        dc.setActive(true);
        return dc;
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // FORUM
    // ══════════════════════════════════════════════════════════════════════════════
    private void seedForum(ForumPostRepository postRepo,
                           ForumCommentRepository commentRepo,
                           UserRepository userRepo) {
        List<User> all = new ArrayList<>();
        userRepo.findAll().forEach(all::add);

        User admin = all.stream().filter(u -> u.getRole() == User.Role.ADMIN).findFirst().orElse(null);
        User teacher = all.stream().filter(u -> u.getRole() == User.Role.TEACHER).findFirst().orElse(null);
        List<User> students = all.stream().filter(u -> u.getRole() == User.Role.STUDENT).toList();

        ForumPost p1 = mkPost(admin, "How to use Present Simple tense correctly?",
                "I always get confused between 'He works' and 'He work'. Can someone explain the rules? " +
                "Also, when do we use 'does' vs 'do'? Thanks!",
                "grammar,present-simple,english-basics", 156, 12, true);
        p1.setViewCount(423);
        postRepo.save(p1);

        ForumPost p2 = mkPost(students.get(0), "What's the difference between 'make' and 'do'?",
                "I see these two verbs everywhere but I never know which one to use. " +
                "For example: 'make a decision' vs 'do the dishes'. Is there a pattern?",
                "vocabulary,verbs,confusing-words", 203, 8, false);
        p2.setViewCount(612);
        postRepo.save(p2);

        ForumPost p3 = mkPost(teacher, "Top 10 tips for improving your English listening skills",
                "Many students struggle with listening comprehension. Here are my top strategies:\n\n" +
                "1. Listen to English every day, even just 15 minutes\n" +
                "2. Watch movies with subtitles (English subtitles, not your native language)\n" +
                "3. Practice shadowing - repeat what you hear immediately\n" +
                "4. Focus on connected speech and contractions\n" +
                "5. Keep a vocabulary journal of phrases you hear\n" +
                "6. Use podcasts designed for learners\n" +
                "7. Don't worry about every word - focus on the main idea\n" +
                "8. Practice dictation exercises\n" +
                "9. Read transcripts while listening\n" +
                "10. Be patient - listening takes time to improve!",
                "listening,tips,learning-strategies", 289, 24, true);
        p3.setViewCount(1847);
        postRepo.save(p3);

        ForumPost p4 = mkPost(students.size() > 1 ? students.get(1) : students.get(0),
                "How to memorize vocabulary effectively?",
                "I study 20 new words every day but I forget them the next day. " +
                "What are some effective techniques to remember vocabulary long-term?",
                "vocabulary,memory,study-tips", 178, 15, false);
        p4.setViewCount(934);
        postRepo.save(p4);

        ForumPost p5 = mkPost(students.size() > 2 ? students.get(2) : students.get(0),
                "IELTS vs TOEFL - which one should I take?",
                "I'm planning to study abroad and need to take an English test. " +
                "What are the main differences between IELTS and TOEFL? " +
                "Which is easier for Vietnamese students?",
                "ielts,toefl,exam-preparation,study-abroad", 145, 9, false);
        p5.setViewCount(1203);
        postRepo.save(p5);

        ForumPost p6 = mkPost(teacher, "Common mistakes Vietnamese learners make",
                "Based on my teaching experience, here are the most common errors:\n\n" +
                "1. Adding 's' to verbs after 'he/she/it' incorrectly\n" +
                "2. Confusing 'since' and 'for' with present perfect\n" +
                "3. Using 'very' instead of 'too much/many'\n" +
                "4. Misplacing adjectives (saying 'a big beautiful house' instead of 'a beautiful big house')\n" +
                "5. Mixing up 'although/though/even though'\n\n" +
                "Feel free to ask about any of these in the comments!",
                "common-mistakes,vietnamese-learners,grammar", 312, 18, true);
        p6.setViewCount(2156);
        postRepo.save(p6);

        // Comments for Post 1 (Present Simple)
        ForumComment c1 = mkComment(p1, teacher, "Great question! Here's the rule: " +
                "We add 's' or 'es' to the verb ONLY when the subject is third person singular " +
                "(he, she, it). 'He works', 'She eats', 'It runs'. " +
                "For 'do' vs 'does': use 'does' with he/she/it, 'do' with I/you/we/they. " +
                "Example: 'Does she work here?' vs 'Do they work here?'", 45, true);
        commentRepo.save(c1);
        p1.setAcceptedCommentId(c1.getId());
        postRepo.save(p1);

        ForumComment c2 = mkComment(p1, students.get(0), "Thank you! That makes so much sense now. " +
                "I always forgot the 's' on verbs after 'he'!", 12, false);
        commentRepo.save(c2);

        // Comments for Post 2 (Make vs Do)
        ForumComment c3 = mkComment(p2, teacher, "This is a great observation! Here's the pattern:\n" +
                "MAKE = create, produce, build\n" +
                "• make a decision, make a cake, make money, make progress\n\n" +
                "DO = perform, execute, carry out\n" +
                "• do the laundry, do homework, do business, do a good job\n\n" +
                "There are also fixed expressions you need to memorize:\n" +
                "• make friends, make a mistake, make an effort\n" +
                "• do the dishes, do the shopping, do someone a favor", 67, true);
        commentRepo.save(c3);
        p2.setAcceptedCommentId(c3.getId());
        postRepo.save(p2);

        // Comments for Post 3 (Listening tips)
        ForumComment c4 = mkComment(p3, students.get(0), "The shadowing technique changed my listening! " +
                "I started watching English YouTube videos every day with English subtitles and " +
                "my comprehension improved a lot in just 2 months.", 28, false);
        commentRepo.save(c4);

        ForumComment c5 = mkComment(p3, students.size() > 1 ? students.get(1) : students.get(0),
                "Number 7 is so important. I used to panic when I didn't understand every single word. " +
                "Now I focus on the main idea and it feels much more relaxing.", 15, false);
        commentRepo.save(c5);

        // Comments for Post 4 (Vocabulary memorization)
        ForumComment c6 = mkComment(p4, teacher, "The key is 'spaced repetition'! " +
                "Review words at increasing intervals: 1 day, 3 days, 7 days, 14 days, 30 days. " +
                "Use flashcards and try to recall the meaning before flipping. " +
                "Also, learn words in context (in sentences) not just as isolated words.", 52, true);
        commentRepo.save(c6);
        p4.setAcceptedCommentId(c6.getId());
        postRepo.save(p4);

        // Comments for Post 5 (IELTS vs TOEFL)
        ForumComment c7 = mkComment(p5, teacher, "Both tests are widely accepted. Key differences:\n" +
                "• IELTS: paper-based or computer, British/American accent, face-to-face speaking\n" +
                "• TOEFL: fully computer-based, mainly American accent, robot speaking test\n\n" +
                "For Vietnamese students, IELTS is often preferred because:\n" +
                "1. Speaking is with a real person (less intimidating)\n" +
                "2. The British accent is often more familiar from school\n" +
                "3. More universities in Europe accept IELTS", 38, true);
        commentRepo.save(c7);
        p5.setAcceptedCommentId(c7.getId());
        postRepo.save(p5);

        log.info("  → Seeded {} forum posts and {} comments", postRepo.count(), commentRepo.count());
    }

    private ForumPost mkPost(User author, String title, String content, String tags,
                              int upvotes, int comments, boolean solved) {
        ForumPost p = new ForumPost();
        p.setUserId(author.getId());
        p.setTitle(title);
        p.setContent(content);
        p.setTags(tags);
        p.setUpvoteCount(upvotes);
        p.setCommentCount(comments);
        p.setSolved(solved);
        return p;
    }

    private ForumComment mkComment(ForumPost post, User author, String content,
                                  int upvotes, boolean accepted) {
        ForumComment c = new ForumComment();
        c.setPostId(post.getId());
        c.setUserId(author.getId());
        c.setContent(content);
        c.setUpvoteCount(upvotes);
        c.setAccepted(accepted);
        return c;
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // SAVED WORDS (Flashcard prepopulated for demo students)
    // ══════════════════════════════════════════════════════════════════════════════
    private void seedSavedWords(SavedWordRepository repo,
                               VocabularyRepository vocabRepo,
                               UserRepository userRepo) {
        List<User> students = userRepo.findByRole(User.Role.STUDENT);
        List<VocabularyWord> vocab = vocabRepo.findAll();
        if (students.isEmpty() || vocab.isEmpty()) return;

        User s1 = students.get(0);
        User s2 = students.size() > 1 ? students.get(1) : s1;

        // Student 1 saved 12 words
        List<VocabularyWord> s1Words = vocab.stream()
                .filter(w -> w.getLevel() == User.Level.A1 || w.getLevel() == User.Level.A2)
                .limit(12)
                .toList();
        int day = 0;
        for (VocabularyWord w : s1Words) {
            SavedWord sw = new SavedWord();
            sw.setUserId(s1.getId());
            sw.setVocabularyId(w.getId());
            sw.setWord(w.getWord());
            sw.setTranslation(w.getTranslation());
            sw.setPronunciation(w.getPronunciation());
            sw.setLevel(w.getLevel().name());
            sw.setReviewCount(day > 5 ? (int)(Math.random() * 5) : 0);
            sw.setCorrectCount(day > 5 ? (int)(Math.random() * sw.getReviewCount()) : 0);
            sw.setIntervalDays(day > 5 ? (1 << Math.min(sw.getReviewCount(), 5)) : 1);
            sw.setNextReviewDate(LocalDate.now().plusDays(day > 5 ? sw.getIntervalDays() : 1));
            sw.setSavedAt(LocalDateTime.now().minusDays(day + 3));
            repo.save(sw);
            day++;
        }

        // Student 2 saved 8 words
        List<VocabularyWord> s2Words = vocab.stream()
                .filter(w -> w.getLevel() == User.Level.A2 || w.getLevel() == User.Level.B1)
                .limit(8)
                .toList();
        day = 0;
        for (VocabularyWord w : s2Words) {
            SavedWord sw = new SavedWord();
            sw.setUserId(s2.getId());
            sw.setVocabularyId(w.getId());
            sw.setWord(w.getWord());
            sw.setTranslation(w.getTranslation());
            sw.setPronunciation(w.getPronunciation());
            sw.setLevel(w.getLevel().name());
            sw.setReviewCount(day > 3 ? (int)(Math.random() * 4) : 0);
            sw.setCorrectCount(day > 3 ? (int)(Math.random() * sw.getReviewCount()) : 0);
            sw.setIntervalDays(day > 3 ? (1 << Math.min(sw.getReviewCount(), 4)) : 1);
            sw.setNextReviewDate(LocalDate.now().plusDays(day > 3 ? sw.getIntervalDays() : 1));
            sw.setSavedAt(LocalDateTime.now().minusDays(day + 2));
            repo.save(sw);
            day++;
        }

        log.info("  → Seeded {} saved words", repo.count());
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // STORIES (called after storyRepository count check)
    // ══════════════════════════════════════════════════════════════════════════════
    private void seedStories(StoryRepository storyRepo,
                            UserStoryProgressRepository progressRepo,
                            UserRepository userRepo) {
        // Stories were already seeded by the existing DataInitializer.
        // We just add story progress for existing students.
        List<Story> stories = storyRepo.findAll();
        List<User> students = userRepo.findByRole(User.Role.STUDENT);
        if (stories.isEmpty() || students.isEmpty()) return;

        // Student 1 completed "The Lost Cat" with 5/5 correct
        User s1 = students.get(0);
        UserStoryProgress sp1 = new UserStoryProgress();
        sp1.setUserId(s1.getId());
        sp1.setStoryId(stories.get(0).getId());
        sp1.setCurrentStep(5);
        sp1.setCorrectCount(5);
        sp1.setTotalSteps(5);
        sp1.setCompleted(true);
        sp1.setScore(100);
        sp1.setCompletedAt(LocalDateTime.now().minusDays(2));
        progressRepo.save(sp1);

        // Student 2 started "A Day at School" - completed 3/5 steps
        if (students.size() > 1) {
            User s2 = students.get(1);
            UserStoryProgress sp2 = new UserStoryProgress();
            sp2.setUserId(s2.getId());
            sp2.setStoryId(stories.stream()
                    .filter(s -> s.getTitle().contains("School"))
                    .findFirst()
                    .map(Story::getId)
                    .orElse(stories.get(0).getId()));
            sp2.setCurrentStep(3);
            sp2.setCorrectCount(2);
            sp2.setTotalSteps(5);
            sp2.setCompleted(false);
            sp2.setScore(0);
            sp2.setLastAccessedAt(LocalDateTime.now().minusDays(1));
            progressRepo.save(sp2);
        }

        log.info("  → Seeded {} story progress records", progressRepo.count());
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // AI CHAT HISTORY
    // ══════════════════════════════════════════════════════════════════════════════
    private void seedAIChat(AIChatHistoryRepository repo, UserRepository userRepo) {
        List<User> students = userRepo.findByRole(User.Role.STUDENT);
        if (students.isEmpty()) return;

        User s1 = students.get(0);

        repo.saveAll(List.of(
            mkChat(s1.getId(), "Can you explain the difference between 'make' and 'do' in English?",
                    "Great question! Here is the key difference:\n\n" +
                    "MAKE - We use 'make' when creating, producing, or building something new.\n" +
                    "• make a cake, make a decision, make money, make progress, make a phone call\n\n" +
                    "DO - We use 'do' when performing an action, task, or activity.\n" +
                    "• do homework, do the laundry, do the dishes, do business, do exercise\n\n" +
                    "There are also fixed expressions you just need to memorize:\n" +
                    "• make a mistake, make an effort, make friends, make a complaint\n" +
                    "• do someone a favor, do the shopping, do the cooking",
                    "vocabulary"),
            mkChat(s1.getId(), "How do I use the present perfect tense correctly?",
                    "The Present Perfect can be tricky! Here is a clear explanation:\n\n" +
                    "FORM: Subject + have/has + past participle\n" +
                    "• I have studied (not 'I have studied')\n" +
                    "• She has finished her homework\n\n" +
                    "USE 1: Experience in your life up to now\n" +
                    "• I have visited Paris three times\n" +
                    "• Have you ever tried Vietnamese food?\n\n" +
                    "USE 2: A recently completed action with present result\n" +
                    "• I have lost my keys (and I still cannot find them)\n\n" +
                    "KEY WORDS: already, yet, just, ever, never, for, since\n" +
                    "• I have already eaten breakfast\n" +
                    "• Have you finished yet?",
                    "grammar"),
            mkChat(s1.getId(), "What is the best way to improve my English speaking?",
                    "Here are my top recommendations for improving your speaking:\n\n" +
                    "1. DAILY PRACTICE - Speak for at least 15 minutes every day\n" +
                    "2. SHADOWING - Listen and repeat native speakers immediately\n" +
                    "3. THINK IN ENGLISH - Start thinking in English instead of translating\n" +
                    "4. RECORD YOURSELF - Listen back to identify pronunciation issues\n" +
                    "5. FIND A PARTNER - Practice with someone, even if they are also learning\n" +
                    "6. USE TONGUE TWISTERS - Improve pronunciation: 'She sells seashells'\n" +
                    "7. LEARN PHrases - Don't learn words alone, learn whole phrases\n" +
                    "8. BE BOLD - Make mistakes! They are the best teachers\n\n" +
                    "Consistency is more important than intensity. 20 minutes daily beats 3 hours once a week!",
                    "speaking-tips")
        ));

        log.info("  → Seeded {} AI chat history records", repo.count());
    }

    private AIChatHistory mkChat(Long userId, String userMsg, String aiResponse, String context) {
        AIChatHistory chat = new AIChatHistory();
        chat.setUserId(userId);
        chat.setUserMessage(userMsg);
        chat.setAiResponse(aiResponse);
        chat.setConversationContext(context);
        return chat;
    }
}
