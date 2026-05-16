package com.abcenglish.dto;

public class GradingRequest {
    private String questionType;
    private String question;
    private String userAnswer;
    private String context;
    
    public String getQuestionType() { return questionType; }
    public void setQuestionType(String questionType) { this.questionType = questionType; }
    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }
    public String getUserAnswer() { return userAnswer; }
    public void setUserAnswer(String userAnswer) { this.userAnswer = userAnswer; }
    public String getContext() { return context; }
    public void setContext(String context) { this.context = context; }
}
