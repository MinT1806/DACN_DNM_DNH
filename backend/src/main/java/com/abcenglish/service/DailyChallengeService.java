package com.abcenglish.service;

import com.abcenglish.entity.*;
import com.abcenglish.repository.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class DailyChallengeService {

    private final DailyChallengeRepository challengeRepository;
    private final UserChallengeRepository userChallengeRepository;
    private final UserRepository userRepository;
    private final ExerciseRepository exerciseRepository;
    private final ExerciseQuestionRepository questionRepository;
    private final ExerciseSubmissionRepository submissionRepository;
    private final QuizResultRepository quizResultRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final VocabularyRepository vocabularyWordRepository;
    private final AIGradingService aiGradingService;
    private final ObjectMapper objectMapper;

    public DailyChallengeService(
            DailyChallengeRepository challengeRepository,
            UserChallengeRepository userChallengeRepository,
            UserRepository userRepository,
            ExerciseRepository exerciseRepository,
            ExerciseQuestionRepository questionRepository,
            ExerciseSubmissionRepository submissionRepository,
            QuizResultRepository quizResultRepository,
            UserBadgeRepository userBadgeRepository,
            VocabularyRepository vocabularyWordRepository,
            AIGradingService aiGradingService
    ) {
        this.challengeRepository = challengeRepository;
        this.userChallengeRepository = userChallengeRepository;
        this.userRepository = userRepository;
        this.exerciseRepository = exerciseRepository;
        this.questionRepository = questionRepository;
        this.submissionRepository = submissionRepository;
        this.quizResultRepository = quizResultRepository;
        this.userBadgeRepository = userBadgeRepository;
        this.vocabularyWordRepository = vocabularyWordRepository;
        this.aiGradingService = aiGradingService;
        this.objectMapper = new ObjectMapper();
    }

    // ============================================================
    // MAIN API: Get today's full daily challenge
    // ============================================================
    public Map<String, Object> getTodayChallenge(Long userId) {
        LocalDate today = LocalDate.now();
        User user = userRepository.findById(userId).orElse(null);
        User.Level userLevel = user != null && user.getLevel() != null
                ? user.getLevel() : User.Level.A1;

        // Get or create today's challenge record
        DailyChallenge challenge = challengeRepository.findByChallengeDateAndActiveTrue(today)
                .orElseGet(() -> createTodayChallenge(today));

        // Check if user already completed this challenge
        Optional<UserChallenge> existingCompletion = userChallengeRepository
                .findByUserIdAndChallengeId(userId, challenge.getId());
        boolean alreadyCompleted = existingCompletion.isPresent() && existingCompletion.get().isCompleted();

        // Build the full challenge with all 4 sections
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("challengeId", challenge.getId());
        response.put("date", today.toString());
        response.put("title", challenge.getTitle());
        response.put("description", challenge.getDescription());
        response.put("difficulty", challenge.getDifficulty());
        response.put("xpReward", challenge.getXpReward());
        response.put("userLevel", userLevel.name());
        response.put("alreadyCompleted", alreadyCompleted);

        // Build 4 sections: Reading, Listening, Vocabulary, Writing
        Map<String, Object> sections = buildChallengeSections(userId, userLevel, today);
        response.put("sections", sections);

        // Progress tracking
        Map<String, Object> progress = new HashMap<>();
        progress.put("completed", alreadyCompleted);
        progress.put("score", existingCompletion.map(UserChallenge::getProgress).orElse(0));
        progress.put("xpEarned", existingCompletion.map(UserChallenge::getXpEarned).orElse(0));
        response.put("progress", progress);

        // Streak info
        Map<String, Object> streakInfo = getStreakInfo(userId);
        response.put("streak", streakInfo);

        return response;
    }

    private Map<String, Object> buildChallengeSections(Long userId, User.Level level, LocalDate date) {
        Map<String, Object> sections = new LinkedHashMap<>();

        // 1. READING SECTION
        sections.put("reading", buildReadingSection(level));
        // 2. LISTENING SECTION
        sections.put("listening", buildListeningSection(level));
        // 3. VOCABULARY SECTION
        sections.put("vocabulary", buildVocabularySection(userId, level));
        // 4. WRITING SECTION (Writing or Speaking - alternate by day)
        boolean isSpeakingDay = date.getDayOfWeek().getValue() % 4 == 0;
        sections.put("writing", buildWritingSection(level, isSpeakingDay ? "speaking" : "writing"));

        return sections;
    }

    private Map<String, Object> buildReadingSection(User.Level level) {
        Map<String, Object> section = new LinkedHashMap<>();
        section.put("type", "reading");
        section.put("title", "Reading Comprehension");
        section.put("description", "Read the passage and answer the questions.");
        section.put("icon", "📖");
        section.put("maxScore", 10);
        section.put("questions", buildReadingQuestions(level));
        return section;
    }

    private List<Map<String, Object>> buildReadingQuestions(User.Level level) {
        List<Map<String, Object>> questions = new ArrayList<>();
        String passage = getReadingPassage(level);
        String[] qTexts = getReadingQuestions(level);
        String[] answers = getReadingAnswers(level);
        String[][] options = getReadingOptions(level);

        for (int i = 0; i < 4; i++) {
            Map<String, Object> q = new LinkedHashMap<>();
            q.put("id", "read_" + i);
            q.put("passage", passage);
            q.put("question", qTexts[i]);
            q.put("options", Arrays.asList(options[i]));
            q.put("correctAnswer", answers[i]);
            q.put("explanation", "Check the passage for the answer.");
            q.put("points", 2);
            questions.add(q);
        }
        return questions;
    }

    private String getReadingPassage(User.Level level) {
        return switch (level) {
            case A1 -> "My name is Anna. I am a student. I live in a small house near the school. Every morning, I wake up at six o'clock. I eat breakfast with my family at seven. Then I walk to school. I like English class very much. My teacher is very kind.";
            case A2 -> "Last weekend, my family went to the beach. We left home early in the morning. The weather was beautiful and sunny. We played in the water and built sandcastles. We ate delicious food at a small restaurant near the beach. Everyone had a great time. We will definitely go there again.";
            case B1 -> "Technology has changed the way we communicate. With smartphones and the internet, we can talk to people anywhere in the world instantly. However, some people worry that we spend too much time looking at screens. Studies show that too much screen time can cause health problems. Many experts recommend taking regular breaks from devices.";
            case B2 -> "The concept of remote work has gained significant momentum in recent years. While some companies have embraced hybrid models, others remain skeptical about employee productivity outside traditional office settings. Research indicates that remote workers often report higher job satisfaction but may struggle with isolation. The debate continues as organizations seek the optimal balance between flexibility and collaboration.";
            default -> "Climate change represents one of the most pressing challenges facing humanity today. Rising global temperatures have led to melting ice caps, rising sea levels, and increasingly severe weather events. Scientists worldwide agree that human activities, particularly the burning of fossil fuels, are the primary drivers of this phenomenon. Urgent action is required to mitigate the worst effects.";
        };
    }

    private String[] getReadingQuestions(User.Level level) {
        return switch (level) {
            case A1 -> new String[]{
                    "What is the name of the student?",
                    "What time does Anna wake up?",
                    "How does Anna go to school?",
                    "What does Anna like?"
            };
            case A2 -> new String[]{
                    "When did the family go to the beach?",
                    "How was the weather?",
                    "What did they do at the beach?",
                    "What will they do in the future?"
            };
            case B1 -> new String[]{
                    "What has technology changed?",
                    "What problem do some people worry about?",
                    "According to studies, what can too much screen time cause?",
                    "What do experts recommend?"
            };
            case B2 -> new String[]{
                    "What has gained momentum recently?",
                    "What do some companies remain skeptical about?",
                    "What do remote workers often report?",
                    "What are organizations seeking?"
            };
            default -> new String[]{
                    "What is described as the most pressing challenge?",
                    "What have rising temperatures led to?",
                    "What do scientists agree is the primary cause?",
                    "What is required to address this issue?"
            };
        };
    }

    private String[] getReadingAnswers(User.Level level) {
        return switch (level) {
            case A1 -> new String[]{"Anna", "Six o'clock", "She walks to school", "English class"};
            case A2 -> new String[]{"Last weekend", "Beautiful and sunny", "Played in water", "Go there again"};
            case B1 -> new String[]{"The way we communicate", "Too much screen time", "Health problems", "Taking regular breaks"};
            case B2 -> new String[]{"Remote work", "Employee productivity", "Higher job satisfaction", "Balance between flexibility and collaboration"};
            default -> new String[]{"Climate change", "Melting ice caps and rising sea levels", "Human activities", "Urgent action"};
        };
    }

    private String[][] getReadingOptions(User.Level level) {
        return switch (level) {
            case A1 -> new String[][]{
                    {"Anna", "Maria", "Peter", "John"},
                    {"Five o'clock", "Six o'clock", "Seven o'clock", "Eight o'clock"},
                    {"She walks to school", "She takes a bus", "She rides a bike", "She drives"},
                    {"Math class", "English class", "Science class", "Art class"}
            };
            case A2 -> new String[][]{
                    {"Last week", "Last weekend", "Last month", "Yesterday"},
                    {"Rainy and cold", "Cloudy", "Beautiful and sunny", "Windy"},
                    {"Watched movies", "Played in water", "Went shopping", "Visited family"},
                    {"Never go there", "Go there again", "Move there", "Sell the house"}
            };
            case B1 -> new String[][]{
                    {"The way we travel", "The way we communicate", "The way we eat", "The way we sleep"},
                    {"Not enough screen time", "Too much screen time", "No technology", "Too many meetings"},
                    {"Happiness", "Health problems", "Better sleep", "More friends"},
                    {"Using more devices", "Taking regular breaks", "Working more hours", "Buying new phones"}
            };
            case B2 -> new String[][]{
                    {"Remote work", "Office work", "Part-time work", "Contract work"},
                    {"Employee happiness", "Employee productivity", "Employee salary", "Employee hours"},
                    {"Higher salary", "Better equipment", "Higher job satisfaction", "More vacation"},
                    {"More meetings", "More rules", "Balance between flexibility and collaboration", "Less work"}
            };
            default -> new String[][]{
                    {"Economic growth", "Climate change", "War", "Pandemic"},
                    {"Faster internet", "Melting ice caps and rising sea levels", "More forests", "Colder weather"},
                    {"Natural events", "Alien activities", "Human activities", "Animal behavior"},
                    {"More research", "Waiting", "Urgent action", "Ignoring the problem"}
            };
        };
    }

    private Map<String, Object> buildListeningSection(User.Level level) {
        Map<String, Object> section = new LinkedHashMap<>();
        section.put("type", "listening");
        section.put("title", "Listening Comprehension");
        section.put("description", "Listen carefully and choose the correct answer.");
        section.put("icon", "🎧");
        section.put("maxScore", 10);
        section.put("audioScript", getListeningScript(level));
        section.put("questions", buildListeningQuestions(level));
        return section;
    }

    private String getListeningScript(User.Level level) {
        return switch (level) {
            case A1 -> "Hello, my name is Tom. I am ten years old. I have a pet dog. His name is Max. Max is brown and white. I take him for a walk every morning. Max likes to play in the park.";
            case A2 -> "Good morning, everyone. Today I want to talk about my favorite city. I live in London. It is a big and exciting city. There are many interesting places to visit. Last month, I visited the famous Big Ben and the London Eye. The weather was nice, and I took many photos.";
            case B1 -> "I'm calling to confirm my flight booking. My name is Sarah Johnson, and my reference number is FL789. I'm booked on flight AB456 from New York to Los Angeles on the 15th of March. The flight departs at 9:30 in the morning and arrives at 12:45 in the afternoon. Please let me know if you need any additional information.";
            case B2 -> "Recent advances in artificial intelligence have sparked considerable debate among educators. While AI offers unprecedented opportunities for personalized learning, concerns remain about data privacy and the potential replacement of human teachers. A balanced approach that leverages technology while maintaining human connection appears to be the most promising path forward.";
            default -> "The global economy faces significant headwinds as central banks attempt to control inflation through monetary policy adjustments. Economists warn that aggressive rate hikes could trigger a recession, while insufficient action might allow inflation to become entrenched. Market participants are closely monitoring economic indicators for signs of the direction of travel.";
        };
    }

    private List<Map<String, Object>> buildListeningQuestions(User.Level level) {
        List<Map<String, Object>> questions = new ArrayList<>();
        String[] qTexts = getListeningQuestions(level);
        String[] answers = getListeningAnswers(level);
        String[][] options = getListeningOptions(level);

        for (int i = 0; i < 4; i++) {
            Map<String, Object> q = new LinkedHashMap<>();
            q.put("id", "listen_" + i);
            q.put("question", qTexts[i]);
            q.put("options", Arrays.asList(options[i]));
            q.put("correctAnswer", answers[i]);
            q.put("explanation", "Listen to the audio again to check your answer.");
            q.put("points", 2);
            questions.add(q);
        }
        return questions;
    }

    private String[] getListeningQuestions(User.Level level) {
        return switch (level) {
            case A1 -> new String[]{
                    "What is the speaker's name?",
                    "How old is the speaker?",
                    "What is the name of the pet?",
                    "What color is the pet?"
            };
            case A2 -> new String[]{
                    "What is the speaker talking about?",
                    "Which city does the speaker live in?",
                    "What did the speaker visit last month?",
                    "What did the speaker take?"
            };
            case B1 -> new String[]{
                    "Why is the speaker calling?",
                    "What is the flight reference number?",
                    "When does the flight depart?",
                    "Where does the flight go?"
            };
            case B2 -> new String[]{
                    "What has sparked considerable debate?",
                    "What concern remains about AI?",
                    "What appears to be the most promising approach?",
                    "What do educators debate about?"
            };
            default -> new String[]{
                    "What challenge does the global economy face?",
                    "What are central banks attempting to control?",
                    "What could aggressive rate hikes trigger?",
                    "Who is monitoring economic indicators?"
            };
        };
    }

    private String[] getListeningAnswers(User.Level level) {
        return switch (level) {
            case A1 -> new String[]{"Tom", "Ten years old", "Max", "Brown and white"};
            case A2 -> new String[]{"A favorite city", "London", "Big Ben and the London Eye", "Many photos"};
            case B1 -> new String[]{"To confirm flight booking", "FL789", "9:30 in the morning", "From New York to Los Angeles"};
            case B2 -> new String[]{"Advances in AI", "Data privacy", "Balanced approach with human connection", "AI in education"};
            default -> new String[]{"Significant headwinds", "Inflation", "A recession", "Market participants"};
        };
    }

    private String[][] getListeningOptions(User.Level level) {
        return switch (level) {
            case A1 -> new String[][]{
                    {"Tom", "Sam", "Max", "Bob"},
                    {"Eight years old", "Nine years old", "Ten years old", "Eleven years old"},
                    {"Max", "Buddy", "Rocky", "Charlie"},
                    {"Black and white", "Brown and white", "Brown only", "White only"}
            };
            case A2 -> new String[][]{
                    {"A favorite restaurant", "A favorite city", "A favorite movie", "A favorite book"},
                    {"Paris", "London", "Berlin", "Madrid"},
                    {"The museum and the park", "Big Ben and the London Eye", "The zoo and the beach", "The tower and the bridge"},
                    {"Many friends", "Many photos", "Many souvenirs", "Many books"}
            };
            case B1 -> new String[][]{
                    {"To book a flight", "To confirm flight booking", "To cancel a flight", "To change a flight"},
                    {"FL123", "FL456", "FL789", "FL321"},
                    {"8:30 in the morning", "9:30 in the morning", "10:30 in the morning", "11:30 in the morning"},
                    {"From LA to New York", "From New York to Los Angeles", "From London to Paris", "From Tokyo to Sydney"}
            };
            case B2 -> new String[][]{
                    {"Robotics", "Advances in AI", "Online learning", "Education reform"},
                    {"Teacher replacement", "Data privacy", "Student performance", "Technology costs"},
                    {"Full technology adoption", "Eliminating teachers", "Balanced approach with human connection", "Ignoring technology"},
                    {"AI in education", "Technology in schools", "Future of work", "Machine learning"}
            };
            default -> new String[][]{
                    {"Trade wars", "Global economic growth", "Significant headwinds", "Market instability"},
                    {"Interest rates", "Inflation", "Unemployment", "Stock prices"},
                    {"A boom", "A recession", "Stability", "Growth"},
                    {"Governments", "Consumers", "Market participants", "Banks"}
            };
        };
    }

    private Map<String, Object> buildVocabularySection(Long userId, User.Level level) {
        Map<String, Object> section = new LinkedHashMap<>();
        section.put("type", "vocabulary");
        section.put("title", "Vocabulary");
        section.put("description", "Match the English words with their Vietnamese meanings.");
        section.put("icon", "📚");
        section.put("maxScore", 10);
        section.put("questions", buildVocabularyQuestions(userId, level));
        return section;
    }

    private List<Map<String, Object>> buildVocabularyQuestions(Long userId, User.Level level) {
        List<VocabularyWord> words;
        try {
            words = vocabularyWordRepository.findAll().stream()
                    .filter(w -> w.getLevel() == level)
                    .limit(10)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            words = new ArrayList<>();
        }

        if (words.size() < 5) {
            words = getDefaultVocabulary(level);
        }

        List<Map<String, Object>> questions = new ArrayList<>();
        for (int i = 0; i < Math.min(5, words.size()); i++) {
            VocabularyWord word = words.get(i);
            List<String> options = new ArrayList<>();
            options.add(word.getTranslation());
            for (int j = 0; j < words.size(); j++) {
                if (j != i) options.add(words.get(j).getTranslation());
            }
            Collections.shuffle(options);

            Map<String, Object> q = new LinkedHashMap<>();
            q.put("id", "vocab_" + i);
            q.put("word", word.getWord());
            q.put("pronunciation", word.getPronunciation());
            q.put("options", options);
            q.put("correctAnswer", word.getTranslation());
            q.put("example", word.getExample());
            q.put("points", 2);
            questions.add(q);
        }
        return questions;
    }

    private List<VocabularyWord> getDefaultVocabulary(User.Level level) {
        List<VocabularyWord> words = new ArrayList<>();
        String[][] vocabData = getVocabData(level);

        for (String[] data : vocabData) {
            VocabularyWord w = new VocabularyWord();
            w.setWord(data[0]);
            w.setPronunciation(data[1]);
            w.setTranslation(data[2]);
            w.setExample(data[3]);
            w.setLevel(level);
            words.add(w);
        }
        return words;
    }

    private String[][] getVocabData(User.Level level) {
        return switch (level) {
            case A1 -> new String[][]{
                    {"hello", "/həˈloʊ/", "xin chào", "Hello! How are you?"},
                    {"water", "/ˈwɔːtər/", "nước", "I want a glass of water."},
                    {"book", "/bʊk/", "sách", "This is an interesting book."},
                    {"friend", "/frend/", "bạn bè", "She is my best friend."},
                    {"happy", "/ˈhæpi/", "hạnh phúc", "I am very happy today."},
                    {"house", "/haʊs/", "nhà", "My house has three rooms."},
                    {"school", "/skuːl/", "trường học", "I go to school every day."},
                    {"cat", "/kæt/", "con mèo", "The cat is sleeping."}
            };
            case A2 -> new String[][]{
                    {"knowledge", "/ˈnɒlɪdʒ/", "kiến thức", "Knowledge is power."},
                    {"believe", "/bɪˈliːv/", "tin tưởng", "I believe in you."},
                    {"adventure", "/ədˈventʃər/", "cuộc phiêu lưu", "Life is an adventure."},
                    {"beautiful", "/ˈbjuːtɪfəl/", "đẹp", "What a beautiful day!"},
                    {"environment", "/ɪnˈvaɪrənmənt/", "môi trường", "We must protect the environment."},
                    {"remember", "/rɪˈmembər/", "nhớ", "Remember to call me."},
                    {"different", "/ˈdɪfərənt/", "khác nhau", "We have different opinions."},
                    {"important", "/ɪmˈpɔːrtənt/", "quan trọng", "Health is important."}
            };
            case B1 -> new String[][]{
                    {"communicate", "/kəˈmjuːnɪkeɪt/", "giao tiếp", "We need to communicate better."},
                    {"experience", "/ɪkˈspɪəriəns/", "kinh nghiệm", "She has a lot of experience."},
                    {"opportunity", "/ˌɒpərˈtjuːnɪti/", "cơ hội", "This is a great opportunity."},
                    {"successful", "/səkˈsesfəl/", "thành công", "He is a successful businessman."},
                    {"knowledge", "/ˈnɒlɪdʒ/", "kiến thức", "Knowledge is essential for success."},
                    {"achieve", "/əˈtʃiːv/", "đạt được", "You can achieve your goals."},
                    {"challenge", "/ˈtʃælɪndʒ/", "thử thách", "This is a big challenge."},
                    {"consider", "/kənˈsɪdər/", "xem xét", "Please consider my request."}
            };
            case B2 -> new String[][]{
                    {"sustainable", "/səˈsteɪnəbəl/", "bền vững", "We need sustainable development."},
                    {"significant", "/sɪɡˈnɪfɪkənt/", "quan trọng", "There is significant progress."},
                    {"contemporary", "/kənˈtempərəri/", "đương đại", "Contemporary art is interesting."},
                    {"phenomenon", "/fɪˈnɒmɪnən/", "hiện tượng", "Climate change is a global phenomenon."},
                    {"comprehensive", "/ˌkɒmprɪˈhensɪv/", "toàn diện", "This is a comprehensive analysis."},
                    {"substantial", "/səbˈstænʃəl/", "đáng kể", "There has been substantial growth."},
                    {"implement", "/ˈɪmplɪment/", "thực hiện", "We need to implement these changes."},
                    {"acknowledge", "/əkˈnɒlɪdʒ/", "thừa nhận", "I acknowledge your effort."}
            };
            default -> new String[][]{
                    {"paradigm", "/ˈpærədaɪm/", "mô hình", "This represents a new paradigm."},
                    {"ubiquitous", "/juːˈbɪkwɪtəs/", "phổ biến khắp", "Smartphones have become ubiquitous."},
                    {"mitigate", "/ˈmɪtɪɡeɪt/", "giảm thiểu", "We must mitigate the risks."},
                    {"ameliorate", "/əˈmiːliəreɪt/", "cải thiện", "Policies aim to ameliorate poverty."},
                    {"exacerbate", "/ɪɡˈzæsərbeɪt/", "làm trầm trọng thêm", "This will exacerbate the problem."},
                    {"substantiate", "/səbˈstænʃieɪt/", "chứng minh", "You need to substantiate your claims."},
                    {"innovative", "/ˈɪnəvətɪv/", "đổi mới", "An innovative solution is needed."},
                    {"pragmatic", "/præɡˈmætɪk/", "thực dụng", "Take a pragmatic approach."}
            };
        };
    }

    private Map<String, Object> buildWritingSection(User.Level level, String type) {
        Map<String, Object> section = new LinkedHashMap<>();
        String writingType = type.equals("speaking") ? "speaking" : "writing";
        section.put("type", writingType);
        section.put("subtype", type);
        section.put("title", type.equals("speaking") ? "Speaking Practice" : "Writing Practice");
        section.put("description", type.equals("speaking")
                ? "Read the prompt and speak your answer. Your response will be transcribed and graded by AI."
                : "Write about the given topic. Your writing will be graded by AI.");
        section.put("icon", type.equals("speaking") ? "🎤" : "✍️");
        section.put("maxScore", 10);
        section.put("prompt", getWritingPrompt(level, type));
        section.put("minWords", type.equals("speaking") ? 10 : 50);
        section.put("timeLimit", type.equals("speaking") ? 60 : 300);
        return section;
    }

    private Map<String, Object> getWritingPrompt(User.Level level, String type) {
        String[][] prompts = switch (type) {
            case "speaking" -> new String[][]{
                    {"Describe your favorite place to visit.", "Talk about a place you love and explain why it is special to you."},
                    {"What did you do last weekend?", "Tell me about your activities last weekend."},
                    {"Describe your best friend.", "Tell me about your best friend and what makes them special."},
                    {"What are your plans for this year?", "Share your goals and plans for this year."}
            };
            default -> new String[][]{
                    {"Do you think technology helps or harms education?", "Write about 80-120 words about how technology affects learning."},
                    {"Describe a memorable trip you have taken.", "Write about 80-120 words describing a trip you enjoyed."},
                    {"What are the benefits of learning English?", "Write about 80-120 words about why English is important."},
                    {"How do you stay healthy?", "Write about 80-120 words with tips for staying healthy."}
            };
        };

        int idx = (int) (LocalDate.now().toEpochDay() % prompts.length);
        String[] selected = prompts[idx];

        Map<String, Object> prompt = new LinkedHashMap<>();
        prompt.put("title", selected[0]);
        prompt.put("instruction", selected[1]);
        prompt.put("level", level.name());
        return prompt;
    }

    // ============================================================
    // SUBMIT: Process challenge answers
    // ============================================================
    @Transactional
    public Map<String, Object> submitChallenge(Long userId, Map<String, Object> submissionData) {
        Long challengeId = parseLong(submissionData.get("challengeId"));
        Map<String, Object> answers = parseJson(submissionData.get("answers"));
        long startTime = submissionData.get("startTime") != null
                ? parseLong(submissionData.get("startTime")) : 0;
        long endTime = System.currentTimeMillis();
        long timeSpentSeconds = Math.max(1, (endTime - startTime) / 1000);

        DailyChallenge challenge = challengeRepository.findById(challengeId)
                .orElseThrow(() -> new RuntimeException("Challenge not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if already submitted
        Optional<UserChallenge> existingCompletion = userChallengeRepository
                .findByUserIdAndChallengeId(userId, challengeId);
        if (existingCompletion.isPresent() && existingCompletion.get().isCompleted()) {
            Map<String, Object> alreadyDone = new HashMap<>();
            alreadyDone.put("success", false);
            alreadyDone.put("message", "Bạn đã hoàn thành thử thách này rồi!");
            alreadyDone.put("alreadyCompleted", true);
            return alreadyDone;
        }

        // Grade each section
        Map<String, Object> readingResult = gradeSection(answers, "reading", user.getLevel(), "passage");
        Map<String, Object> listeningResult = gradeSection(answers, "listening", user.getLevel(), "audio");
        Map<String, Object> vocabResult = gradeVocabSection(answers);
        Map<String, Object> writingResult = gradeWritingSection(answers, user.getLevel());

        // Calculate total score
        double readingScore = (double) readingResult.get("score");
        double listeningScore = (double) listeningResult.get("score");
        double vocabScore = (double) vocabResult.get("score");
        double writingScore = (double) writingResult.get("score");
        double totalScore = (readingScore + listeningScore + vocabScore + writingScore) / 4.0;

        // XP calculation based on score
        int baseXP = challenge.getXpReward();
        int earnedXP = (int) Math.round(baseXP * (totalScore / 10.0));
        boolean passed = totalScore >= 5.0;

        if (passed) {
            earnedXP = Math.max(earnedXP, (int) Math.round(baseXP * 0.5));
        }

        // Update or create user challenge record
        UserChallenge userChallenge = existingCompletion.orElseGet(() -> {
            UserChallenge uc = new UserChallenge();
            uc.setUserId(userId);
            uc.setChallengeId(challengeId);
            return uc;
        });
        userChallenge.setProgress((int) Math.round(totalScore));
        userChallenge.setCompleted(passed);
        userChallenge.setXpEarned(earnedXP);
        if (passed) {
            userChallenge.setCompletedAt(LocalDateTime.now());
        }
        userChallengeRepository.save(userChallenge);

        // Save individual submissions
        saveSubmissions(userId, challengeId, answers, readingResult, listeningResult, vocabResult, writingResult);

        // Update streak
        int newStreak = updateStreak(userId);

        // Check and award badges
        List<Map<String, Object>> newBadges = checkAndAwardBadges(userId, newStreak, totalScore);

        // Build detailed result response
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("passed", passed);
        result.put("totalScore", Math.round(totalScore * 10.0) / 10.0);
        result.put("earnedXP", earnedXP);
        result.put("newStreak", newStreak);
        result.put("timeSpentSeconds", timeSpentSeconds);
        result.put("alreadyCompleted", false);

        // Section breakdown
        Map<String, Object> breakdown = new LinkedHashMap<>();
        breakdown.put("reading", readingResult);
        breakdown.put("listening", listeningResult);
        breakdown.put("vocabulary", vocabResult);
        breakdown.put("writing", writingResult);
        result.put("breakdown", breakdown);

        // AI Feedback summary
        Map<String, Object> feedback = new LinkedHashMap<>();
        feedback.put("overall", generateOverallFeedback(totalScore));
        feedback.put("reading", readingResult.get("feedback"));
        feedback.put("listening", listeningResult.get("feedback"));
        feedback.put("vocabulary", vocabResult.get("feedback"));
        feedback.put("writing", writingResult.get("feedback"));
        result.put("feedback", feedback);

        // New badges
        if (!newBadges.isEmpty()) {
            result.put("newBadges", newBadges);
        }

        // Rewards summary
        Map<String, Object> rewards = new LinkedHashMap<>();
        rewards.put("xp", earnedXP);
        rewards.put("streak", newStreak);
        rewards.put("badges", newBadges);
        rewards.put("levelUp", false);
        result.put("rewards", rewards);

        return result;
    }

    private Map<String, Object> gradeSection(
            Map<String, Object> answers, String section,
            User.Level level, String contextKey) {

        int totalPoints = 0;
        int earnedPoints = 0;
        List<Map<String, Object>> details = new ArrayList<>();

        String sectionKey = section;
        if (answers.containsKey(sectionKey)) {
            @SuppressWarnings("unchecked")
            Map<String, Object> sectionAnswers = (Map<String, Object>) answers.get(sectionKey);

            for (Map.Entry<String, Object> entry : sectionAnswers.entrySet()) {
                String qId = entry.getKey();
                Object userAnswerObj = entry.getValue();
                String userAnswer = userAnswerObj != null ? userAnswerObj.toString().trim().toLowerCase() : "";

                String qKey = sectionKey + "_" + qId;
                String correctAnswer = getCorrectAnswer(sectionKey, qId, level);

                boolean correct = userAnswer.equals(correctAnswer.toLowerCase());
                int points = correct ? 2 : 0;
                earnedPoints += points;
                totalPoints += 2;

                Map<String, Object> detail = new HashMap<>();
                detail.put("questionId", qId);
                detail.put("userAnswer", userAnswerObj);
                detail.put("correctAnswer", correctAnswer);
                detail.put("correct", correct);
                detail.put("points", points);
                detail.put("maxPoints", 2);
                details.add(detail);
            }
        }

        double score = totalPoints > 0 ? (double) earnedPoints / totalPoints * 10.0 : 0.0;
        String feedback = score >= 8 ? "Tuyệt vời! Bạn làm rất tốt!"
                : score >= 6 ? "Khá tốt! Cần cải thiện thêm."
                : score >= 4 ? "Cố gắng hơn nữa nhé!"
                : "Hãy ôn lại bài và thử lại nhé!";

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("score", Math.round(score * 10.0) / 10.0);
        result.put("earnedPoints", earnedPoints);
        result.put("totalPoints", totalPoints);
        result.put("feedback", feedback);
        result.put("details", details);
        return result;
    }

    private String getCorrectAnswer(String section, String qId, User.Level level) {
        int idx = Integer.parseInt(qId.split("_")[1]);

        if ("reading".equals(section)) {
            String[] answers = getReadingAnswers(level);
            return idx < answers.length ? answers[idx] : "";
        } else if ("listening".equals(section)) {
            String[] answers = getListeningAnswers(level);
            return idx < answers.length ? answers[idx] : "";
        }
        return "";
    }

    private Map<String, Object> gradeVocabSection(Map<String, Object> answers) {
        int totalPoints = 0;
        int earnedPoints = 0;
        List<Map<String, Object>> details = new ArrayList<>();

        if (answers.containsKey("vocabulary")) {
            @SuppressWarnings("unchecked")
            Map<String, Object> vocabAnswers = (Map<String, Object>) answers.get("vocabulary");

            for (Map.Entry<String, Object> entry : vocabAnswers.entrySet()) {
                String qId = entry.getKey();
                Object userAnswerObj = entry.getValue();
                String userAnswer = userAnswerObj != null ? userAnswerObj.toString().trim() : "";

                String[] parts = qId.split("_");
                if (parts.length < 2) continue;

                int idx = Integer.parseInt(parts[1]);
                String correctAnswer = getVocabCorrectAnswer(idx);

                boolean correct = userAnswer.equalsIgnoreCase(correctAnswer);
                int points = correct ? 2 : 0;
                earnedPoints += points;
                totalPoints += 2;

                Map<String, Object> detail = new HashMap<>();
                detail.put("questionId", qId);
                detail.put("userAnswer", userAnswerObj);
                detail.put("correctAnswer", correctAnswer);
                detail.put("correct", correct);
                detail.put("points", points);
                detail.put("maxPoints", 2);
                details.add(detail);
            }
        }

        double score = totalPoints > 0 ? (double) earnedPoints / totalPoints * 10.0 : 0.0;
        String feedback = score >= 8 ? "Từ vựng tuyệt vời!"
                : score >= 6 ? "Tốt lắm, cần học thêm từ mới!"
                : score >= 4 ? "Cần ôn từ vựng nhiều hơn."
                : "Hãy học lại các từ đã học nhé!";

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("score", Math.round(score * 10.0) / 10.0);
        result.put("earnedPoints", earnedPoints);
        result.put("totalPoints", totalPoints);
        result.put("feedback", feedback);
        result.put("details", details);
        return result;
    }

    private String getVocabCorrectAnswer(int idx) {
        String[][] data = new String[][]{
                {"xin chào", "nước", "sách", "bạn bè", "hạnh phúc"},
                {"kiến thức", "tin tưởng", "cuộc phiêu lưu", "đẹp", "môi trường"},
                {"giao tiếp", "kinh nghiệm", "cơ hội", "thành công", "thử thách"},
                {"bền vững", "quan trọng", "đương đại", "hiện tượng", "toàn diện"},
                {"mô hình", "phổ biến khắp", "giảm thiểu", "cải thiện", "thực dụng"}
        };
        User.Level level = User.Level.A1;
        int levelIdx = level.ordinal();
        if (levelIdx >= data.length) levelIdx = 0;
        return idx < data[levelIdx].length ? data[levelIdx][idx] : "";
    }

    private Map<String, Object> gradeWritingSection(Map<String, Object> answers, User.Level level) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("score", 10.0);
        result.put("earnedPoints", 10);
        result.put("totalPoints", 10);
        result.put("details", new ArrayList<Map<String, Object>>());

        if (!answers.containsKey("writing")) {
            result.put("feedback", "Bạn chưa hoàn thành phần viết.");
            return result;
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> writingAnswer = (Map<String, Object>) answers.get("writing");
        String userText = writingAnswer.getOrDefault("text", "").toString();
        String transcribedText = writingAnswer.getOrDefault("transcribed", "").toString();
        String textToGrade = !transcribedText.isEmpty() ? transcribedText : userText;

        if (textToGrade.trim().length() < 10) {
            result.put("score", 0.0);
            result.put("earnedPoints", 0);
            result.put("feedback", "Câu trả lời quá ngắn. Vui lòng viết thêm.");
            return result;
        }

        try {
            String promptText = writingAnswer.getOrDefault("prompt", "Write about the given topic.").toString();
            String subtype = writingAnswer.getOrDefault("type", "writing").toString();

            AIGradingService.GradingResult aiResult;
            if ("speaking".equals(subtype)) {
                aiResult = aiGradingService.gradeSpeaking(promptText, textToGrade, null);
            } else {
                aiResult = aiGradingService.gradeWriting(promptText, textToGrade, null);
            }

            if (aiResult.score() != null) {
                double score = aiResult.score();
                result.put("score", Math.round(score * 10.0) / 10.0);
                result.put("earnedPoints", (int) Math.round(score));
                result.put("feedback", aiResult.feedback());
                result.put("aiDetails", aiResult.details());

                // Add strengths and suggestions
                if (!aiResult.details().isEmpty()) {
                    Map<String, Object> firstDetail = aiResult.details().get(0);
                    Object strengths = null;
                    Object improvements = null;
                    Object suggestions = null;

                    for (Map<String, Object> d : aiResult.details()) {
                        if (d.containsKey("strengths")) strengths = d.get("strengths");
                        if (d.containsKey("areasForImprovement")) improvements = d.get("areasForImprovement");
                        if (d.containsKey("suggestions")) suggestions = d.get("suggestions");
                    }
                    result.put("strengths", strengths);
                    result.put("areasForImprovement", improvements);
                    result.put("suggestions", suggestions);
                }
            } else {
                result.put("feedback", aiResult.feedback());
            }
        } catch (Exception e) {
            log.error("AI grading failed for writing: {}", e.getMessage());
            result.put("feedback", "AI đang bận. Bài viết của bạn đã được ghi nhận.");
        }

        return result;
    }

    private void saveSubmissions(
            Long userId, Long challengeId,
            Map<String, Object> answers,
            Map<String, Object> readingResult,
            Map<String, Object> listeningResult,
            Map<String, Object> vocabResult,
            Map<String, Object> writingResult
    ) {
        try {
            // Save quiz result
            QuizResult quizResult = new QuizResult();
            quizResult.setUserId(userId);
            quizResult.setTotalQuestions(17);
            quizResult.setCorrectAnswers((int) Math.round(
                    ((Number) readingResult.get("earnedPoints")).doubleValue() +
                    ((Number) listeningResult.get("earnedPoints")).doubleValue() +
                    ((Number) vocabResult.get("earnedPoints")).doubleValue()
            ));
            quizResult.setScore(((Number) readingResult.get("score")).doubleValue());
            quizResult.setQuizType("DAILY_CHALLENGE");
            quizResult.setCompletedAt(LocalDateTime.now());
            quizResultRepository.save(quizResult);
        } catch (Exception e) {
            log.error("Failed to save quiz result: {}", e.getMessage());
        }
    }

    private String generateOverallFeedback(double score) {
        if (score >= 9) return "Xuất sắc! Bạn làm bài rất tốt. Hãy tiếp tục phát huy!";
        if (score >= 8) return "Tuyệt vời! Bạn đã hoàn thành xuất sắc bài tập hôm nay.";
        if (score >= 7) return "Tốt lắm! Bạn đang tiến bộ rất nhanh.";
        if (score >= 6) return "Khá tốt! Cần cố gắng thêm một chút nữa nhé.";
        if (score >= 5) return "Đạt yêu cầu. Hãy ôn tập thêm để cải thiện điểm số.";
        if (score >= 4) return "Cần cố gắng hơn. Đừng bỏ cuộc nhé!";
        return "Đừng nản lòng! Mỗi ngày là một cơ hội để tiến bộ.";
    }

    // ============================================================
    // STREAK MANAGEMENT
    // ============================================================
    @Transactional
    public int updateStreak(Long userId) {
        LocalDate today = LocalDate.now();

        // Find today's challenge
        Optional<DailyChallenge> todayChallenge = challengeRepository.findByChallengeDateAndActiveTrue(today);

        if (todayChallenge.isEmpty()) {
            return getCurrentStreak(userId);
        }

        // Check if user completed today's challenge
        boolean completedToday = userChallengeRepository.existsByUserIdAndChallengeIdAndCompletedTrue(
                userId, todayChallenge.get().getId());

        if (!completedToday) {
            return getCurrentStreak(userId);
        }

        // Calculate streak
        int streak = 0;
        LocalDate checkDate = today;

        for (int i = 0; i < 365; i++) {
            final LocalDate date = checkDate.minusDays(i);
            Optional<DailyChallenge> dc = challengeRepository.findByChallengeDateAndActiveTrue(date);

            if (dc.isEmpty()) {
                if (!date.equals(today)) break;
                continue;
            }

            boolean completed = userChallengeRepository.existsByUserIdAndChallengeIdAndCompletedTrue(userId, dc.get().getId());
            if (completed || date.equals(today)) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    }

    public int getCurrentStreak(Long userId) {
        List<UserChallenge> completed = userChallengeRepository.findByUserIdAndCompletedTrue(userId);
        if (completed.isEmpty()) return 0;

        LocalDate today = LocalDate.now();
        int streak = 0;

        for (int i = 0; i < 365; i++) {
            final LocalDate date = today.minusDays(i);
            boolean hasCompleted = completed.stream().anyMatch(uc -> {
                DailyChallenge dc = challengeRepository.findById(uc.getChallengeId()).orElse(null);
                return dc != null && dc.getChallengeDate().isEqual(date);
            });

            if (hasCompleted) {
                streak++;
            } else if (i > 0) {
                break;
            }
        }

        return streak;
    }

    public Map<String, Object> getStreakInfo(Long userId) {
        int currentStreak = getCurrentStreak(userId);
        int longestStreak = getLongestStreak(userId);
        LocalDate today = LocalDate.now();

        // Check if today is completed
        Optional<DailyChallenge> todayChallenge = challengeRepository.findByChallengeDateAndActiveTrue(today);
        boolean todayCompleted = todayChallenge.isPresent() &&
                userChallengeRepository.existsByUserIdAndChallengeIdAndCompletedTrue(userId, todayChallenge.get().getId());

        Map<String, Object> streak = new LinkedHashMap<>();
        streak.put("currentStreak", currentStreak);
        streak.put("longestStreak", longestStreak);
        streak.put("todayCompleted", todayCompleted);
        streak.put("lastActivityDate", today.toString());

        // Next milestone
        String nextMilestone = currentStreak < 3 ? "3 ngày"
                : currentStreak < 7 ? "7 ngày"
                : currentStreak < 14 ? "14 ngày"
                : currentStreak < 30 ? "30 ngày"
                : currentStreak < 60 ? "60 ngày"
                : currentStreak < 100 ? "100 ngày" : "Infinity";
        streak.put("nextMilestone", nextMilestone);
        streak.put("daysToNextMilestone", calculateDaysToMilestone(currentStreak));

        return streak;
    }

    private int getLongestStreak(Long userId) {
        List<UserChallenge> completed = userChallengeRepository.findByUserIdAndCompletedTrue(userId);
        if (completed.isEmpty()) return 0;

        // Sort by date
        List<LocalDate> dates = completed.stream()
                .map(uc -> challengeRepository.findById(uc.getChallengeId()).orElse(null))
                .filter(Objects::nonNull)
                .map(DailyChallenge::getChallengeDate)
                .sorted()
                .collect(Collectors.toList());

        if (dates.isEmpty()) return 0;

        int longest = 1;
        int current = 1;

        for (int i = 1; i < dates.size(); i++) {
            if (dates.get(i).equals(dates.get(i - 1).plusDays(1))) {
                current++;
                longest = Math.max(longest, current);
            } else {
                current = 1;
            }
        }

        return longest;
    }

    private int calculateDaysToMilestone(int current) {
        int[] milestones = {3, 7, 14, 30, 60, 100, 365};
        for (int m : milestones) {
            if (current < m) return m - current;
        }
        return 0;
    }

    // ============================================================
    // BADGE SYSTEM
    // ============================================================
    @Transactional
    public List<Map<String, Object>> checkAndAwardBadges(Long userId, int streak, double score) {
        List<Map<String, Object>> newBadges = new ArrayList<>();

        // Streak badges
        if (streak >= 3 && !userBadgeRepository.existsByUserIdAndBadgeId(userId, "streak_3")) {
            awardBadge(userId, "streak_3", "Bắt Đầu Kiên Trì", "Học liên tục 3 ngày", "3️⃣", "COMMON");
            newBadges.add(Map.of("id", "streak_3", "name", "Bắt Đầu Kiên Trì", "icon", "3️⃣", "rarity", "COMMON"));
        }
        if (streak >= 7 && !userBadgeRepository.existsByUserIdAndBadgeId(userId, "streak_7")) {
            awardBadge(userId, "streak_7", "Tuần Lễ", "Học liên tục 7 ngày", "🔥", "RARE");
            newBadges.add(Map.of("id", "streak_7", "name", "Tuần Lễ", "icon", "🔥", "rarity", "RARE"));
        }
        if (streak >= 14 && !userBadgeRepository.existsByUserIdAndBadgeId(userId, "streak_14")) {
            awardBadge(userId, "streak_14", "Nửa Tháng", "Học liên tục 14 ngày", "⭐", "RARE");
            newBadges.add(Map.of("id", "streak_14", "name", "Nửa Tháng", "icon", "⭐", "rarity", "RARE"));
        }
        if (streak >= 30 && !userBadgeRepository.existsByUserIdAndBadgeId(userId, "streak_30")) {
            awardBadge(userId, "streak_30", "Tháng Kiên Trì", "Học liên tục 30 ngày", "💎", "EPIC");
            newBadges.add(Map.of("id", "streak_30", "name", "Tháng Kiên Trì", "icon", "💎", "rarity", "EPIC"));
        }
        if (streak >= 60 && !userBadgeRepository.existsByUserIdAndBadgeId(userId, "streak_60")) {
            awardBadge(userId, "streak_60", "Hai Tháng", "Học liên tục 60 ngày", "👑", "EPIC");
            newBadges.add(Map.of("id", "streak_60", "name", "Hai Tháng", "icon", "👑", "rarity", "EPIC"));
        }
        if (streak >= 100 && !userBadgeRepository.existsByUserIdAndBadgeId(userId, "streak_100")) {
            awardBadge(userId, "streak_100", "Trăm Ngày", "Học liên tục 100 ngày", "🏆", "LEGENDARY");
            newBadges.add(Map.of("id", "streak_100", "name", "Trăm Ngày", "icon", "🏆", "rarity", "LEGENDARY"));
        }

        // Perfect score badge
        if (score >= 10 && !userBadgeRepository.existsByUserIdAndBadgeId(userId, "perfect_daily")) {
            awardBadge(userId, "perfect_daily", "Hoàn Hảo", "Đạt điểm tuyệt đối trong Daily Challenge", "💯", "RARE");
            newBadges.add(Map.of("id", "perfect_daily", "name", "Hoàn Hảo", "icon", "💯", "rarity", "RARE"));
        }

        // High score badge
        if (score >= 8 && !userBadgeRepository.existsByUserIdAndBadgeId(userId, "high_score")) {
            awardBadge(userId, "high_score", "Xuất Sắc", "Đạt 8+ điểm trong Daily Challenge", "🌟", "COMMON");
            newBadges.add(Map.of("id", "high_score", "name", "Xuất Sắc", "icon", "🌟", "rarity", "COMMON"));
        }

        return newBadges;
    }

    private void awardBadge(Long userId, String badgeId, String name, String description, String icon, String rarity) {
        UserBadge badge = new UserBadge(userId, badgeId, name, icon, rarity);
        badge.setBadgeDescription(description);
        userBadgeRepository.save(badge);
    }

    // ============================================================
    // HISTORY
    // ============================================================
    public List<Map<String, Object>> getChallengeHistory(Long userId, int limit) {
        List<UserChallenge> userChallenges = userChallengeRepository.findByUserId(userId);

        return userChallenges.stream()
                .sorted((a, b) -> {
                    LocalDateTime aDate = a.getCompletedAt() != null ? a.getCompletedAt() : LocalDateTime.MIN;
                    LocalDateTime bDate = b.getCompletedAt() != null ? b.getCompletedAt() : LocalDateTime.MIN;
                    return bDate.compareTo(aDate);
                })
                .limit(limit)
                .map(uc -> {
                    Map<String, Object> entry = new LinkedHashMap<>();
                    entry.put("id", uc.getId());
                    entry.put("challengeId", uc.getChallengeId());
                    entry.put("score", uc.getProgress());
                    entry.put("completed", uc.isCompleted());
                    entry.put("xpEarned", uc.getXpEarned());
                    entry.put("completedAt", uc.getCompletedAt() != null ? uc.getCompletedAt().toString() : null);

                    challengeRepository.findById(uc.getChallengeId()).ifPresent(dc -> {
                        entry.put("date", dc.getChallengeDate().toString());
                        entry.put("title", dc.getTitle());
                        entry.put("type", dc.getType() != null ? dc.getType().name() : "MIXED");
                    });

                    return entry;
                })
                .collect(Collectors.toList());
    }

    // ============================================================
    // WEEKLY PROGRESS
    // ============================================================
    public List<Map<String, Object>> getWeeklyProgress(Long userId) {
        LocalDate today = LocalDate.now();
        LocalDate monday = today.with(java.time.DayOfWeek.MONDAY);

        List<Map<String, Object>> weekProgress = new ArrayList<>();

        for (int i = 0; i < 7; i++) {
            LocalDate day = monday.plusDays(i);
            DailyChallenge challenge = challengeRepository.findByChallengeDateAndActiveTrue(day)
                    .orElseGet(() -> createDefaultChallengeForDate(day));

            boolean isCompleted = userId != null &&
                    userChallengeRepository.existsByUserIdAndChallengeIdAndCompletedTrue(userId, challenge.getId());

            Optional<UserChallenge> userProgress = userId != null
                    ? userChallengeRepository.findByUserIdAndChallengeId(userId, challenge.getId())
                    : Optional.empty();

            Map<String, Object> dayData = new LinkedHashMap<>();
            dayData.put("date", day.toString());
            dayData.put("dayOfWeek", day.getDayOfWeek().toString());
            dayData.put("dayOfWeekShort", getDayShort(day.getDayOfWeek().getValue()));
            dayData.put("challengeType", challenge.getType() != null ? challenge.getType().name() : "MIXED");
            dayData.put("challengeTitle", challenge.getTitle());
            dayData.put("completed", isCompleted || day.isAfter(today));
            dayData.put("score", userProgress.map(p -> p.getProgress()).orElse(day.isAfter(today) ? 100 : 0));
            dayData.put("xpEarned", userProgress.map(UserChallenge::getXpEarned).orElse(0));
            dayData.put("isToday", day.isEqual(today));
            dayData.put("isFuture", day.isAfter(today));
            weekProgress.add(dayData);
        }

        return weekProgress;
    }

    // ============================================================
    // CHALLENGE GENERATION
    // ============================================================
    private DailyChallenge createTodayChallenge(LocalDate today) {
        int dayOfWeek = today.getDayOfWeek().getValue();
        String title = getChallengeTitle(dayOfWeek);
        DailyChallenge.ChallengeType type = getChallengeType(dayOfWeek);

        DailyChallenge challenge = new DailyChallenge();
        challenge.setChallengeDate(today);
        challenge.setType(type);
        challenge.setTitle(title);
        challenge.setDescription(getChallengeDescription(type));
        challenge.setXpReward(getXPReward(dayOfWeek));
        challenge.setTargetGoal(10);
        challenge.setDifficulty(getDifficulty(dayOfWeek));
        challenge.setActive(true);

        return challengeRepository.save(challenge);
    }

    private DailyChallenge createDefaultChallengeForDate(LocalDate date) {
        int dayOfWeek = date.getDayOfWeek().getValue();
        String title = getChallengeTitle(dayOfWeek);
        DailyChallenge.ChallengeType type = getChallengeType(dayOfWeek);

        DailyChallenge challenge = new DailyChallenge();
        challenge.setChallengeDate(date);
        challenge.setType(type);
        challenge.setTitle(title);
        challenge.setDescription(getChallengeDescription(type));
        challenge.setXpReward(getXPReward(dayOfWeek));
        challenge.setTargetGoal(10);
        challenge.setDifficulty(getDifficulty(dayOfWeek));
        challenge.setActive(true);

        return challengeRepository.save(challenge);
    }

    private String getChallengeTitle(int dayOfWeek) {
        return switch (dayOfWeek) {
            case 1 -> "Thử Thách Từ Vựng";
            case 2 -> "Luyện Nghe";
            case 3 -> "Ngữ Pháp";
            case 4 -> "Kỹ Năng Viết";
            case 5 -> "Đọc Hiểu";
            case 6 -> "Thử Thách Hỗn Hợp";
            default -> "Cuối Tuần Vui Vẻ";
        };
    }

    private DailyChallenge.ChallengeType getChallengeType(int dayOfWeek) {
        return switch (dayOfWeek) {
            case 1 -> DailyChallenge.ChallengeType.VOCAB_QUIZ;
            case 2 -> DailyChallenge.ChallengeType.LISTENING;
            case 3 -> DailyChallenge.ChallengeType.GRAMMAR_SPRINT;
            case 4 -> DailyChallenge.ChallengeType.SPEAKING_SHADOWING;
            case 5 -> DailyChallenge.ChallengeType.READING_SPEED;
            default -> DailyChallenge.ChallengeType.MIXED;
        };
    }

    private String getChallengeDescription(DailyChallenge.ChallengeType type) {
        return switch (type) {
            case VOCAB_QUIZ -> "Kiểm tra và mở rộng vốn từ vựng của bạn mỗi ngày.";
            case LISTENING -> "Luyện kỹ năng nghe với các đoạn hội thoại thú vị.";
            case GRAMMAR_SPRINT -> "Kiểm tra kiến thức ngữ pháp của bạn.";
            case SPEAKING_SHADOWING -> "Luyện phát âm và nói tiếng Anh.";
            case READING_SPEED -> "Đọc nhanh và hiểu các đoạn văn tiếng Anh.";
            case MIXED -> "Thử thách hỗn hợp với nhiều kỹ năng khác nhau!";
        };
    }

    private int getXPReward(int dayOfWeek) {
        return dayOfWeek <= 5 ? 50 : 75;
    }

    private String getDifficulty(int dayOfWeek) {
        return dayOfWeek <= 2 ? "EASY" : dayOfWeek <= 4 ? "MEDIUM" : "HARD";
    }

    private String getDayShort(int dayOfWeek) {
        return switch (dayOfWeek) {
            case 1 -> "T2";
            case 2 -> "T3";
            case 3 -> "T4";
            case 4 -> "T5";
            case 5 -> "T6";
            case 6 -> "T7";
            default -> "CN";
        };
    }

    // ============================================================
    // UTILITY
    // ============================================================
    private Long parseLong(Object obj) {
        if (obj == null) return null;
        if (obj instanceof Long) return (Long) obj;
        if (obj instanceof Integer) return ((Integer) obj).longValue();
        return Long.parseLong(obj.toString());
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseJson(Object obj) {
        if (obj == null) return new HashMap<>();
        if (obj instanceof Map) return (Map<String, Object>) obj;
        try {
            return objectMapper.readValue(obj.toString(), new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return new HashMap<>();
        }
    }
}
