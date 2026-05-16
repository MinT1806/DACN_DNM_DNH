package com.abcenglish.service;

import com.abcenglish.dto.VocabDTO;
import com.abcenglish.entity.User;
import com.abcenglish.entity.VocabularyWord;
import com.abcenglish.entity.SavedWord;
import com.abcenglish.repository.VocabularyRepository;
import com.abcenglish.repository.SavedWordRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class VocabularyService {

    private final VocabularyRepository vocabRepository;
    private final SavedWordRepository savedWordRepository;

    public VocabularyService(VocabularyRepository vocabRepository,
                             SavedWordRepository savedWordRepository) {
        this.vocabRepository = vocabRepository;
        this.savedWordRepository = savedWordRepository;
    }

    public List<VocabDTO> getAllVocabulary() {
        List<VocabularyWord> words = vocabRepository.findAll();
        List<VocabDTO> result = new ArrayList<VocabDTO>();
        for (VocabularyWord w : words) {
            result.add(VocabDTO.fromEntity(w));
        }
        return result;
    }

    public List<VocabDTO> getVocabularyByLevel(String level) {
        try {
            User.Level lvl = User.Level.valueOf(level.toUpperCase());
            List<VocabularyWord> words = vocabRepository.findByLevel(lvl);
            List<VocabDTO> result = new ArrayList<VocabDTO>();
            for (VocabularyWord w : words) {
                result.add(VocabDTO.fromEntity(w));
            }
            return result;
        } catch (Exception e) {
            return new ArrayList<VocabDTO>();
        }
    }

    public List<VocabDTO> getVocabularyByCategory(String category) {
        List<VocabularyWord> words = vocabRepository.findByCategory(category);
        List<VocabDTO> result = new ArrayList<VocabDTO>();
        for (VocabularyWord w : words) {
            result.add(VocabDTO.fromEntity(w));
        }
        return result;
    }

    public VocabDTO addVocabulary(VocabDTO dto) {
        VocabularyWord word = new VocabularyWord();
        word.setWord(dto.getWord());
        if (dto.getPronunciation() != null) word.setPronunciation(dto.getPronunciation());
        if (dto.getTranslation() != null) word.setTranslation(dto.getTranslation());
        if (dto.getDefinition() != null) word.setDefinition(dto.getDefinition());
        if (dto.getExample() != null) word.setExample(dto.getExample());
        if (dto.getExampleTranslation() != null) word.setExampleTranslation(dto.getExampleTranslation());
        if (dto.getLevel() != null) {
            try { word.setLevel(User.Level.valueOf(dto.getLevel())); } catch (Exception ignored) {}
        }
        if (dto.getCategory() != null) word.setCategory(dto.getCategory());
        if (dto.getAudioUrl() != null) word.setAudioUrl(dto.getAudioUrl());
        if (dto.getImageUrl() != null) word.setImageUrl(dto.getImageUrl());
        if (dto.getCreatedBy() != null) word.setCreatedBy(dto.getCreatedBy());

        VocabularyWord saved = vocabRepository.save(word);
        return VocabDTO.fromEntity(saved);
    }

    public VocabDTO updateVocabulary(Long id, VocabDTO dto) {
        Optional<VocabularyWord> opt = vocabRepository.findById(id);
        if (opt.isEmpty()) return null;

        VocabularyWord word = opt.get();
        if (dto.getWord() != null) word.setWord(dto.getWord());
        if (dto.getPronunciation() != null) word.setPronunciation(dto.getPronunciation());
        if (dto.getTranslation() != null) word.setTranslation(dto.getTranslation());
        if (dto.getDefinition() != null) word.setDefinition(dto.getDefinition());
        if (dto.getExample() != null) word.setExample(dto.getExample());
        if (dto.getExampleTranslation() != null) word.setExampleTranslation(dto.getExampleTranslation());
        if (dto.getLevel() != null) {
            try { word.setLevel(User.Level.valueOf(dto.getLevel())); } catch (Exception ignored) {}
        }
        if (dto.getCategory() != null) word.setCategory(dto.getCategory());

        VocabularyWord saved = vocabRepository.save(word);
        return VocabDTO.fromEntity(saved);
    }

    public VocabDTO patchVocabulary(Long id, VocabDTO dto, Long userId) {
        Optional<VocabularyWord> opt = vocabRepository.findById(id);
        if (opt.isEmpty()) return null;

        VocabularyWord word = opt.get();
        if (word.getCreatedBy() == null || !word.getCreatedBy().equals(userId)) {
            return null;
        }

        if (dto.getWord() != null) word.setWord(dto.getWord());
        if (dto.getPronunciation() != null) word.setPronunciation(dto.getPronunciation());
        if (dto.getTranslation() != null) word.setTranslation(dto.getTranslation());
        if (dto.getDefinition() != null) word.setDefinition(dto.getDefinition());
        if (dto.getExample() != null) word.setExample(dto.getExample());
        if (dto.getExampleTranslation() != null) word.setExampleTranslation(dto.getExampleTranslation());
        if (dto.getLevel() != null) {
            try { word.setLevel(User.Level.valueOf(dto.getLevel())); } catch (Exception ignored) {}
        }
        if (dto.getCategory() != null) word.setCategory(dto.getCategory());

        VocabularyWord saved = vocabRepository.save(word);
        return VocabDTO.fromEntity(saved);
    }

    public void deleteVocabulary(Long id) {
        vocabRepository.deleteById(id);
    }

    public boolean deleteOwnVocabulary(Long id, Long userId) {
        Optional<VocabularyWord> opt = vocabRepository.findById(id);
        if (opt.isEmpty()) return false;
        VocabularyWord word = opt.get();
        if (word.getCreatedBy() == null || !word.getCreatedBy().equals(userId)) {
            return false;
        }
        vocabRepository.delete(word);
        return true;
    }

    public boolean saveWord(Long userId, Long vocabularyId) {
        if (savedWordRepository.existsByUserIdAndVocabularyId(userId, vocabularyId)) {
            return false;
        }

        VocabularyWord vocab = vocabRepository.findById(vocabularyId).orElse(null);
        if (vocab == null) return false;

        SavedWord savedWord = new SavedWord();
        savedWord.setUserId(userId);
        savedWord.setVocabularyId(vocabularyId);
        savedWord.setWord(vocab.getWord());
        savedWord.setTranslation(vocab.getTranslation());
        savedWord.setPronunciation(vocab.getPronunciation());
        savedWord.setLevel(vocab.getLevel() != null ? vocab.getLevel().name() : null);
        savedWord.setSavedAt(LocalDateTime.now());
        savedWord.setLastReviewedAt(LocalDateTime.now());
        savedWordRepository.save(savedWord);

        return true;
    }
}
