package com.abcenglish.service;

import com.abcenglish.entity.*;
import com.abcenglish.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for SavedWordService.
 * Tests vocabulary saving, flashcard management, and review tracking.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SavedWordServiceTest {

    @Mock private SavedWordRepository savedWordRepository;
    @Mock private VocabularyRepository vocabularyRepository;

    private SavedWordService savedWordService;

    @BeforeEach
    void setUp() {
        savedWordService = new SavedWordService(savedWordRepository, vocabularyRepository);
    }

    // ─── Save Word Tests ─────────────────────────────────────────────────────

    @Test
    void saveWord_whenWordNotExists_shouldCreateNewSavedWord() {
        Long userId = 1L;
        Long vocabId = 10L;

        VocabularyWord vocab = new VocabularyWord();
        vocab.setId(vocabId);
        vocab.setWord("Hello");
        vocab.setTranslation("Xin chào");
        vocab.setPronunciation("/həˈloʊ/");
        vocab.setLevel(User.Level.A1);

        when(savedWordRepository.existsByUserIdAndVocabularyId(userId, vocabId)).thenReturn(false);
        when(vocabularyRepository.findById(vocabId)).thenReturn(Optional.of(vocab));
        when(savedWordRepository.save(any(SavedWord.class))).thenAnswer(inv -> {
            SavedWord sw = inv.getArgument(0);
            sw.setId(1L);
            return sw;
        });

        SavedWord result = savedWordService.saveWord(userId, vocabId);

        assertNotNull(result);
        assertEquals("Hello", result.getWord());
        assertEquals("Xin chào", result.getTranslation());
        assertEquals("/həˈloʊ/", result.getPronunciation());
        assertEquals("A1", result.getLevel());
        assertEquals(userId, result.getUserId());
        assertEquals(vocabId, result.getVocabularyId());
        assertFalse(result.isLearned());
        verify(savedWordRepository).save(any(SavedWord.class));
    }

    @Test
    void saveWord_whenWordAlreadyExists_shouldReturnExisting() {
        Long userId = 1L;
        Long vocabId = 10L;

        SavedWord existing = new SavedWord();
        existing.setId(5L);
        existing.setUserId(userId);
        existing.setVocabularyId(vocabId);
        existing.setWord("Hello");
        existing.setLearned(false);

        when(savedWordRepository.existsByUserIdAndVocabularyId(userId, vocabId)).thenReturn(true);
        when(savedWordRepository.findByUserIdAndLearnedFalseOrderBySavedAtDesc(userId))
            .thenReturn(List.of(existing));

        SavedWord result = savedWordService.saveWord(userId, vocabId);

        assertNotNull(result);
        assertEquals(5L, result.getId());
        verify(savedWordRepository, never()).save(any());
    }

    @Test
    void saveWord_whenVocabNotFound_shouldReturnNull() {
        Long userId = 1L;
        Long vocabId = 999L;

        when(savedWordRepository.existsByUserIdAndVocabularyId(userId, vocabId)).thenReturn(false);
        when(vocabularyRepository.findById(vocabId)).thenReturn(Optional.empty());

        SavedWord result = savedWordService.saveWord(userId, vocabId);

        assertNull(result);
        verify(savedWordRepository, never()).save(any());
    }

    // ─── Unsave Word Tests ─────────────────────────────────────────────────

    @Test
    void unSaveWord_whenWordExists_shouldDeleteAndReturnTrue() {
        Long userId = 1L;
        Long vocabId = 10L;

        when(savedWordRepository.existsByUserIdAndVocabularyId(userId, vocabId)).thenReturn(true);

        boolean result = savedWordService.unSaveWord(userId, vocabId);

        assertTrue(result);
        verify(savedWordRepository).deleteByUserIdAndVocabularyId(userId, vocabId);
    }

    @Test
    void unSaveWord_whenWordNotExists_shouldReturnFalse() {
        Long userId = 1L;
        Long vocabId = 999L;

        when(savedWordRepository.existsByUserIdAndVocabularyId(userId, vocabId)).thenReturn(false);

        boolean result = savedWordService.unSaveWord(userId, vocabId);

        assertFalse(result);
        verify(savedWordRepository, never()).deleteByUserIdAndVocabularyId(any(), any());
    }

    // ─── Get Words Tests ───────────────────────────────────────────────────

    @Test
    void getSavedWords_shouldReturnOrderedList() {
        Long userId = 1L;
        SavedWord sw1 = new SavedWord();
        sw1.setId(1L);
        sw1.setUserId(userId);
        sw1.setWord("Hello");

        SavedWord sw2 = new SavedWord();
        sw2.setId(2L);
        sw2.setUserId(userId);
        sw2.setWord("Goodbye");

        when(savedWordRepository.findByUserIdOrderBySavedAtDesc(userId))
            .thenReturn(List.of(sw2, sw1));

        List<SavedWord> result = savedWordService.getSavedWords(userId);

        assertNotNull(result);
        assertEquals(2, result.size());
    }

    @Test
    void getFlashcardWords_shouldReturnOnlyUnlearned() {
        Long userId = 1L;
        SavedWord sw1 = new SavedWord();
        sw1.setLearned(false);
        sw1.setWord("Hello");

        SavedWord sw2 = new SavedWord();
        sw2.setLearned(true);
        sw2.setWord("Goodbye");

        when(savedWordRepository.findByUserIdAndLearnedFalseOrderBySavedAtDesc(userId))
            .thenReturn(List.of(sw1));

        List<SavedWord> result = savedWordService.getFlashcardWords(userId);

        assertEquals(1, result.size());
        assertEquals("Hello", result.get(0).getWord());
        assertFalse(result.get(0).isLearned());
    }

    // ─── Review / Mark as Learned Tests ────────────────────────────────────

    @Test
    void markAsReviewed_withCorrectAnswer_shouldIncrementCorrectCount() {
        Long userId = 1L;
        Long vocabId = 10L;

        SavedWord savedWord = new SavedWord();
        savedWord.setId(1L);
        savedWord.setUserId(userId);
        savedWord.setVocabularyId(vocabId);
        savedWord.setReviewCount(2);
        savedWord.setCorrectCount(1);
        savedWord.setLearned(false);

        when(savedWordRepository.findByUserIdOrderBySavedAtDesc(userId))
            .thenReturn(List.of(savedWord));
        when(savedWordRepository.save(any(SavedWord.class))).thenReturn(savedWord);

        SavedWord result = savedWordService.markAsReviewed(userId, vocabId, true);

        assertNotNull(result);
        assertEquals(3, result.getReviewCount());
        assertEquals(2, result.getCorrectCount());
        assertFalse(result.isLearned()); // Not yet 3 correct
    }

    @Test
    void markAsReviewed_with3CorrectAnswers_shouldMarkAsLearned() {
        Long userId = 1L;
        Long vocabId = 10L;

        SavedWord savedWord = new SavedWord();
        savedWord.setId(1L);
        savedWord.setUserId(userId);
        savedWord.setVocabularyId(vocabId);
        savedWord.setReviewCount(2);
        savedWord.setCorrectCount(2); // Already 2 correct
        savedWord.setLearned(false);

        when(savedWordRepository.findByUserIdOrderBySavedAtDesc(userId))
            .thenReturn(List.of(savedWord));
        when(savedWordRepository.save(any(SavedWord.class))).thenAnswer(inv -> inv.getArgument(0));

        SavedWord result = savedWordService.markAsReviewed(userId, vocabId, true);

        assertNotNull(result);
        assertEquals(3, result.getReviewCount());
        assertEquals(3, result.getCorrectCount());
        assertTrue(result.isLearned()); // 3 correct = learned threshold reached
    }

    @Test
    void markAsReviewed_withWrongAnswer_shouldNotChangeCorrectCount() {
        Long userId = 1L;
        Long vocabId = 10L;

        SavedWord savedWord = new SavedWord();
        savedWord.setId(1L);
        savedWord.setUserId(userId);
        savedWord.setVocabularyId(vocabId);
        savedWord.setReviewCount(5);
        savedWord.setCorrectCount(3);
        savedWord.setLearned(true);

        when(savedWordRepository.findByUserIdOrderBySavedAtDesc(userId))
            .thenReturn(List.of(savedWord));
        when(savedWordRepository.save(any(SavedWord.class))).thenReturn(savedWord);

        SavedWord result = savedWordService.markAsReviewed(userId, vocabId, false);

        assertNotNull(result);
        assertEquals(6, result.getReviewCount());
        assertEquals(3, result.getCorrectCount()); // Unchanged
    }

    @Test
    void markAsReviewed_whenWordNotFound_shouldReturnNull() {
        Long userId = 1L;
        Long vocabId = 999L;

        when(savedWordRepository.findByUserIdOrderBySavedAtDesc(userId))
            .thenReturn(List.of());

        SavedWord result = savedWordService.markAsReviewed(userId, vocabId, true);

        assertNull(result);
        verify(savedWordRepository, never()).save(any());
    }

    // ─── Flashcard Stats Tests ───────────────────────────────────────────────

    @Test
    void getFlashcardStats_shouldCalculateCorrectly() {
        Long userId = 1L;

        SavedWord sw1 = new SavedWord();
        sw1.setLearned(true);
        sw1.setReviewCount(10);
        sw1.setCorrectCount(9);

        SavedWord sw2 = new SavedWord();
        sw2.setLearned(false);
        sw2.setReviewCount(5);
        sw2.setCorrectCount(3);

        SavedWord sw3 = new SavedWord();
        sw3.setLearned(false);
        sw3.setReviewCount(3);
        sw3.setCorrectCount(1);

        when(savedWordRepository.findByUserIdOrderBySavedAtDesc(userId))
            .thenReturn(List.of(sw1, sw2, sw3));

        var result = savedWordService.getFlashcardStats(userId);

        assertNotNull(result);
        assertEquals(3, result.get("totalSaved"));
        assertEquals(1, result.get("totalLearned")); // Only sw1
        assertEquals(18, result.get("totalReviews")); // 10+5+3
        assertEquals(13, result.get("totalCorrect")); // 9+3+1
        // Accuracy = 13/18 * 100 = 72.22%
        assertEquals(72.22, result.get("accuracy"));
    }

    @Test
    void getFlashcardStats_withNoReviews_shouldReturnZeroAccuracy() {
        Long userId = 1L;
        when(savedWordRepository.findByUserIdOrderBySavedAtDesc(userId))
            .thenReturn(List.of());

        var result = savedWordService.getFlashcardStats(userId);

        assertEquals(0, result.get("totalSaved"));
        assertEquals(0.0, result.get("accuracy"));
    }
}
