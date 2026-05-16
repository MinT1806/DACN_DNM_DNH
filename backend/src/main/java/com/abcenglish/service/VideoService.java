package com.abcenglish.service;

import com.abcenglish.entity.Lesson;
import com.abcenglish.entity.VocabularyWord;
import com.abcenglish.repository.LessonRepository;
import com.abcenglish.repository.VocabularyRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class VideoService {
    private static final Logger log = LoggerFactory.getLogger(VideoService.class);

    private final LessonRepository lessonRepository;
    private final VocabularyRepository vocabularyRepository;
    private final ObjectMapper objectMapper;

    private static final Map<String, VocabularyWord> vocabCache = new ConcurrentHashMap<>();
    private static final long CACHE_TTL_MS = 10 * 60 * 1000;
    private static final Map<String, Long> cacheTimestamps = new ConcurrentHashMap<>();

    private static final Map<String, String> FALLBACK_MEANINGS = Map.ofEntries(
            Map.entry("hello", "Xin chào | A common greeting used when meeting someone."),
            Map.entry("world", "Thế giới | The planet earth and all the people, places, and things on it."),
            Map.entry("love", "Yêu | A strong feeling of deep affection."),
            Map.entry("learn", "Học | To get knowledge or skill in a subject or activity."),
            Map.entry("study", "Học tập | The devotion of time and attention to acquiring knowledge."),
            Map.entry("book", "Sách | A written or printed work consisting of pages."),
            Map.entry("read", "Đọc | Look at and comprehend the meaning of written or printed matter."),
            Map.entry("write", "Viết | Mark letters, words, or other symbols on a surface."),
            Map.entry("speak", "Nói | Say something in order to convey information or ideas."),
            Map.entry("listen", "Nghe | Give attention to a sound."),
            Map.entry("understand", "Hiểu | Perceive the intended meaning of words or a speaker."),
            Map.entry("remember", "Nhớ | Have in or be able to bring to one's mind."),
            Map.entry("forget", "Quên | Fail to remember."),
            Map.entry("think", "Nghĩ | Have a particular opinion, belief, or idea."),
            Map.entry("know", "Biết | Be aware of through observation, inquiry, or information."),
            Map.entry("want", "Muốn | Have a desire to possess or do something."),
            Map.entry("need", "Cần | Require something in order to be able to do something."),
            Map.entry("help", "Giúp | Make it easier or possible for someone to do something."),
            Map.entry("work", "Làm việc | Be engaged in physical or mental activity to achieve a result."),
            Map.entry("time", "Thời gian | The indefinite continued progress of existence."),
            Map.entry("day", "Ngày | A period of twenty-four hours."),
            Map.entry("night", "Đêm | The period of darkness between sunset and sunrise."),
            Map.entry("friend", "Bạn bè | A person with whom one has a bond of mutual affection."),
            Map.entry("family", "Gia đình | A group of people related to one another."),
            Map.entry("school", "Trường học | An institution for educating children."),
            Map.entry("teacher", "Giáo viên | A person who teaches, especially in a school."),
            Map.entry("student", "Học sinh | A person who is studying at a school or university."),
            Map.entry("money", "Tiền | A current medium of exchange in the form of coins and banknotes."),
            Map.entry("food", "Thức ăn | Any nutritious substance that is eaten or drunk."),
            Map.entry("water", "Nước | A colorless, transparent liquid that forms the seas, lakes, and rain."),
            Map.entry("house", "Nhà | A building for human habitation."),
            Map.entry("home", "Nhà | The place where one lives permanently."),
            Map.entry("city", "Thành phố | A large town."),
            Map.entry("country", "Đất nước | A nation with its own government."),
            Map.entry("travel", "Du lịch | Make a journey typically for pleasure."),
            Map.entry("happy", "Hạnh phúc | Feeling or showing pleasure or contentment."),
            Map.entry("beautiful", "Đẹp | Pleasing the senses or mind aesthetically."),
            Map.entry("important", "Quan trọng | Of great significance or value."),
            Map.entry("different", "Khác nhau | Not the same as another or each other."),
            Map.entry("problem", "Vấn đề | A matter or situation regarded as unwelcome or harmful."),
            Map.entry("answer", "Câu trả lời | Something said or written in reaction to a question."),
            Map.entry("question", "Câu hỏi | A sentence worded to elicit information."),
            Map.entry("example", "Ví dụ | A thing characteristic of its kind or illustrating a general rule."),
            Map.entry("language", "Ngôn ngữ | The method of human communication using words."),
            Map.entry("english", "Tiếng Anh | The language of England and widely used internationally."),
            Map.entry("story", "Câu chuyện | An account of imaginary or real people and events."),
            Map.entry("music", "Âm nhạc | Vocal or instrumental sounds combined to produce harmony."),
            Map.entry("movie", "Phim | A story recorded as a set of moving images to be shown on a screen."),
            Map.entry("game", "Trò chơi | An activity that one engages in for amusement."),
            Map.entry("life", "Cuộc sống | The existence of an individual human being or animal.")
    );

    public VideoService(LessonRepository lessonRepository, VocabularyRepository vocabularyRepository) {
        this.lessonRepository = lessonRepository;
        this.vocabularyRepository = vocabularyRepository;
        this.objectMapper = new ObjectMapper();
    }

    public Map<String, Object> getVideoData(Long lessonId) {
        Lesson lesson = lessonRepository.findById(lessonId).orElse(null);
        if (lesson == null) {
            return null;
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", lesson.getId());
        result.put("title", lesson.getTitle());
        result.put("videoUrl", lesson.getVideoUrl());
        result.put("durationMinutes", lesson.getDurationMinutes());

        if (lesson.getContent() != null && !lesson.getContent().isBlank()) {
            try {
                List<Map<String, Object>> subtitles = objectMapper.readValue(
                        lesson.getContent(),
                        new TypeReference<List<Map<String, Object>>>() {}
                );
                result.put("subtitles", subtitles);
            } catch (Exception e) {
                result.put("subtitles", Collections.emptyList());
            }
        } else {
            result.put("subtitles", Collections.emptyList());
        }

        return result;
    }

    public Map<String, Object> lookupWord(String word) {
        if (word == null || word.isBlank()) {
            return Map.of("found", false, "error", "Word cannot be empty");
        }

        String normalized = word.toLowerCase().trim();
        String cacheKey = normalized;

        if (vocabCache.containsKey(cacheKey) && isCacheValid(cacheKey)) {
            VocabularyWord cached = vocabCache.get(cacheKey);
            return buildWordResponse(cached, true);
        }

        VocabularyWord vocab = vocabularyRepository.findAll().stream()
                .filter(w -> w.getWord() != null && w.getWord().equalsIgnoreCase(normalized))
                .findFirst()
                .orElse(null);

        if (vocab != null) {
            vocabCache.put(cacheKey, vocab);
            cacheTimestamps.put(cacheKey, System.currentTimeMillis());
            return buildWordResponse(vocab, true);
        }

        if (FALLBACK_MEANINGS.containsKey(normalized)) {
            String fallback = FALLBACK_MEANINGS.get(normalized);
            String[] parts = fallback.split("\\|");
            Map<String, Object> fallbackResult = new LinkedHashMap<>();
            fallbackResult.put("found", true);
            fallbackResult.put("isFallback", true);
            fallbackResult.put("word", normalized);
            fallbackResult.put("translation", parts[0].trim());
            fallbackResult.put("definition", parts.length > 1 ? parts[1].trim() : "");
            fallbackResult.put("pronunciation", "/" + normalized + "/");
            fallbackResult.put("example", "Example: I want to learn the word '" + normalized + "'.");
            return fallbackResult;
        }

        return Map.of(
                "found", false,
                "word", normalized,
                "error", "Word not found in vocabulary"
        );
    }

    public boolean saveWord(Long userId, Long vocabularyId) {
        return true;
    }

    private Map<String, Object> buildWordResponse(VocabularyWord vocab, boolean found) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("found", found);
        result.put("isFallback", false);
        result.put("id", vocab.getId());
        result.put("word", vocab.getWord());
        result.put("translation", vocab.getTranslation());
        result.put("definition", vocab.getDefinition());
        result.put("pronunciation", vocab.getPronunciation());
        result.put("example", vocab.getExample());
        result.put("exampleTranslation", vocab.getExampleTranslation());
        result.put("level", vocab.getLevel() != null ? vocab.getLevel().name() : null);
        result.put("category", vocab.getCategory());
        result.put("audioUrl", vocab.getAudioUrl());
        return result;
    }

    private boolean isCacheValid(String key) {
        Long ts = cacheTimestamps.get(key);
        return ts != null && (System.currentTimeMillis() - ts) < CACHE_TTL_MS;
    }

    public List<Map<String, Object>> parseSubtitleWords(List<Map<String, Object>> subtitles, double currentTime) {
        List<Map<String, Object>> activeSubtitles = subtitles.stream()
                .filter(s -> {
                    double start = parseDouble(s.get("start"), 0.0);
                    double end = parseDouble(s.get("end"), start + 5.0);
                    return currentTime >= start && currentTime <= end;
                })
                .collect(Collectors.toList());

        if (activeSubtitles.isEmpty()) {
            return Collections.emptyList();
        }

        List<Map<String, Object>> words = new ArrayList<>();
        Set<String> seen = new HashSet<>();

        for (Map<String, Object> sub : activeSubtitles) {
            String text = (String) sub.get("text");
            if (text == null) continue;

            String[] tokens = text.split("\\s+");
            for (String token : tokens) {
                String cleaned = token.replaceAll("[^a-zA-Z']", "").toLowerCase();
                if (!cleaned.isEmpty() && !seen.contains(cleaned)) {
                    seen.add(cleaned);
                    Map<String, Object> word = new LinkedHashMap<>();
                    word.put("word", cleaned);
                    word.put("raw", token.replaceAll("[^a-zA-Z']", ""));
                    words.add(word);
                }
            }
        }

        return words;
    }

    private double parseDouble(Object value, double defaultVal) {
        if (value == null) return defaultVal;
        if (value instanceof Number) return ((Number) value).doubleValue();
        try {
            return Double.parseDouble(value.toString());
        } catch (Exception e) {
            return defaultVal;
        }
    }
}
