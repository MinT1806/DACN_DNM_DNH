package com.abcenglish.dto;

import java.util.List;

public class AIExerciseConfig {
    private String skill;
    private String topic;
    private String level;

    public String getSkill() { return skill; }
    public void setSkill(String skill) { this.skill = skill; }
    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }
    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }

    public static class TopicOption {
        private String id;
        private String label;
        private String icon;
        private List<String> keywords;

        public TopicOption(String id, String label, String icon, String... keywords) {
            this.id = id;
            this.label = label;
            this.icon = icon;
            this.keywords = List.of(keywords);
        }

        public String getId() { return id; }
        public String getLabel() { return label; }
        public String getIcon() { return icon; }
        public List<String> getKeywords() { return keywords; }
    }

    public static class SkillOption {
        private String id;
        private String label;
        private String icon;
        private String color;
        private String description;

        public SkillOption(String id, String label, String icon, String color, String description) {
            this.id = id;
            this.label = label;
            this.icon = icon;
            this.color = color;
            this.description = description;
        }

        public String getId() { return id; }
        public String getLabel() { return label; }
        public String getIcon() { return icon; }
        public String getColor() { return color; }
        public String getDescription() { return description; }
    }
}
