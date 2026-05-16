# ĐẶC TẢ HỆ THỐNG - ABC ENGLISH
## Hệ thống Học tiếng Anh Trực tuyến với Công nghệ AI tích hợp

## 1. Tổng quan hệ thống

**Tên hệ thống:** ABC English - Nền tảng học tiếng Anh tích hợp AI

**Tuyên bố sứ mệnh:** Cung cấp trải nghiệm học tiếng Anh cá nhân hóa, tương tác và hiệu quả sử dụng công nghệ AI, từ cơ bản (A1) đến nâng cao (C2), kết hợp giáo dục truyền thống và gamification.

**Mô tả chi tiết:** 
- Nền tảng web cho phép người dùng học tiếng Anh thông qua các khóa học có cấu trúc, bài tập đa dạng, thử thách hàng ngày, forum cộng đồng
- Hệ thống AI (Groq LLM) tự động chấm điểm (Writing, Speaking, Reading, Listening), sinh bài tập theo yêu cầu, và cung cấp chatbot hỗ trợ
- Theo dõi tiến trình chi tiết, cung cấp khuyến nghị cá nhân hóa và phản hồi từng từng
- Gamification: điểm thưởng (XP), huy hiệu, thử thách hàng ngày, streak tracking
- Sự hỗ trợ của cố vấn (mentors) và cộng đồng học tập

**Công nghệ sử dụng:**
- **Backend:** Spring Boot 3, Spring Security, Spring Data JPA, JWT Authentication, WebSocket
- **Frontend:** React.js, React Query, Material UI
- **Database:** MySQL (Production), H2 (Development)
- **AI/LLM:** Groq API (LLaMA 3)
- **Deployment:** Docker, Docker Compose, Nginx
- **Other:** Redis (caching/rate limiting), JavaMail (notifications)

---

## 2. Kiến trúc tổng quát

```

                    FRONTEND LAYER (React.js)                     
  Dashboard | Courses | Exercises | Vocabulary | Forum | Mentor  

                         REST API / WebSocket

                  API GATEWAY & MIDDLEWARE                        
  Authentication (JWT) | Rate Limiting | CORS | Error Handling   

                        

              BACKEND LAYER (Spring Boot 3)                     

 Controllers | Services | Repositories | Security | WebSocket 
 - Auth & User Management                                     
 - Course & Lesson Management                                
 - Exercise Submission & Grading                             
 - AI Integration (Groq LLM)                                 
 - Vocabulary & Spaced Repetition                            
 - Gamification & Leaderboards                               
 - Forum & Community Features                                
 - Mentor Assignment & Messaging                             
 - Analytics & Statistics                                    

                        

              DATA LAYER                                        

  MySQL Database | Redis Cache | File Storage                 

```

---

## 3. Các tác nhân (Actors)

| Actor | Mô tả | Quyền hạn chính |
|-------|--------|-----------------|
| **STUDENT** | Học viên - người dùng chính | Đăng ký, học khóa học, làm bài tập, xem tiến trình, tham gia forum, yêu cầu mentor |
| **TEACHER** | Giáo viên - tạo nội dung | Tạo/sửa/xóa khóa học, bài tập, xem thống kê học viên |
| **ADMIN** | Quản trị viên - quản lý hệ thống | Quản lý users, khóa học, bài tập, xem analytics, quản lý moderators |
| **MENTOR** | Cố vấn - hỗ trợ học viên | Nhận assignment, nhắn tin với học viên, trả lời forum |
| **AI Agent** | Hệ thống AI (Groq) | Chấm bài, sinh bài tập, chatbot 24/7, phân tích điểm yếu |

---

## 4. Danh sách chức năng theo Module (Use Cases)

### 4.1. Module Xác thực & Tài khoản (Authentication & User Management)

| UC ID | Tên chức năng | Actor | Mô tả |
|-------|--------------|-------|--------|
| UC01 | Đăng ký tài khoản | Guest | Đăng ký với username, email, password, fullName, ageGroup (child/teen/adult) → level = A1, role = STUDENT |
| UC02 | Đăng nhập | Guest | Đăng nhập bằng username/email + password → nhận JWT token |
| UC03 | Đăng nhập Social (OAuth) | Guest | Đăng nhập via Google/Facebook → tạo SocialAccount mapping |
| UC04 | Làm bài kiểm tra phân loại | STUDENT | Làm Placement Test 10 câu để xác định trình độ ban đầu (A1-C1) |
| UC05 | Xem/cập nhật hồ sơ | STUDENT/TEACHER | Xem/sửa thông tin cá nhân, avatar, ageGroup, bio |

### 4.2. Module Khóa học (Courses & Lessons)

| UC ID | Tên chức năng | Actor | Mô tả |
|-------|--------------|-------|--------|
| UC06 | Xem danh sách khóa học | All | Xem courses, lọc theo level, sắp xếp theo rating/date |
| UC07 | Xem chi tiết khóa học | All | Xem thông tin khóa học: chapters, lessons, enrolled count, rating |
| UC08 | Đăng ký khóa học (Enroll) | STUDENT | Tạo CourseEnrollment, khởi tạo LessonProgress, xác định progressPercent |
| UC09 | Xem lộ trình học | STUDENT | Xem chapters → lessons, tracking progress per lesson |
| UC10 | Hoàn thành bài học | STUDENT | Đánh dấu lesson hoàn thành → cập nhật CourseEnrollment progress, LessonProgress |
| UC11 | Tạo khóa học | TEACHER/ADMIN | Tạo course mới với chapters |
| UC12 | Tạo chương (Chapter) | TEACHER/ADMIN | Tạo chapter với lessons |
| UC13 | Tạo bài học (Lesson) | TEACHER/ADMIN | Tạo lesson với type (VIDEO, AUDIO, READING, EXERCISE, QUIZ) |
| UC14 | Cập nhật khóa học | TEACHER/ADMIN | Sửa thông tin course, chapters, lessons |
| UC15 | Xóa khóa học | ADMIN | Xóa course (cascade delete) |

### 4.3. Module Bài tập (Exercises & Submission)

| UC ID | Tên chức năng | Actor | Mô tả |
|-------|--------------|-------|--------|
| UC16 | Xem danh sách bài tập | All | Xem exercises, lọc theo level/skill/type (MULTIPLE_CHOICE, FILL_IN_BLANK, WRITING, SPEAKING, READING, LISTENING) |
| UC17 | Xem chi tiết bài tập | All | Xem nội dung, câu hỏi, options, đề bài |
| UC18 | Làm bài tập | STUDENT | Gửi bài làm (userAnswer) cho exercise |
| UC19 | Chấm điểm bài tập (AI) | AI Agent | Gọi Groq API chấm điểm, trả về score (0-100) + feedback chi tiết + suggestions |
| UC20 | Xem kết quả bài làm | STUDENT | Xem ExerciseResult: score, feedback, suggestions, timestamp |
| UC21 | Tạo bài tập | TEACHER/ADMIN | Tạo exercise mới với type, skill, level, content, answerKey, explanation |
| UC22 | Sinh bài tập tự động (AI) | STUDENT | Yêu cầu AI tạo 5 bài tập theo topic/level/skill → Groq sinh content |
| UC23 | Cập nhật bài tập | TEACHER/ADMIN | Sửa nội dung exercise |
| UC24 | Xóa bài tập | ADMIN | Xóa exercise |

### 4.4. Module Từ vựng & Spaced Repetition (Vocabulary)

| UC ID | Tên chức năng | Actor | Mô tả |
|-------|--------------|-------|--------|
| UC25 | Xem danh sách từ vựng | All | Xem VocabularyWords, lọc theo level/category |
| UC26 | Xem chi tiết từ | All | Xem: word, pronunciation, translation, definition, example, part of speech, audio, image |
| UC27 | Xem bộ từ vựng (Set) | STUDENT | Xem VocabularySets công khai (public) |
| UC28 | Học từ vựng | STUDENT | Làm quiz từ vựng, hệ thống cập nhật UserVocabularyProgress theo SM-2 algorithm |
| UC29 | Xem lịch ôn tập | STUDENT | Xem các từ cần ôn tập dựa trên nextReviewDate (Spaced Repetition) |
| UC30 | Tạo bộ từ vựng | TEACHER/ADMIN | Tạo VocabularySet mới |
| UC31 | Quản lý từ vựng | TEACHER/ADMIN | CRUD từ vựng |

### 4.5. Module Thử thách hàng ngày (Daily Challenges & Gamification)

| UC ID | Tên chức năng | Actor | Mô tả |
|-------|--------------|-------|--------|
| UC32 | Xem thử thách hàng ngày | STUDENT | Xem DailyChallenge hôm nay (VOCAB_QUIZ, LISTENING, SPEAKING_SHADOWING, GRAMMAR_SPRINT, READING_SPEED, MIXED) |
| UC33 | Làm thử thách hàng ngày | STUDENT | Hoàn thành challenge → cập nhật UserDailyProgress, nhận XP |
| UC34 | Yêu cầu XP hàng ngày | STUDENT | Nhấn "Claim" sau khi hoàn thành → cập nhật UserStats.totalXp |
| UC35 | Xem streak | STUDENT | Xem current streak, longest streak từ UserStreak |
| UC36 | Quản lý thử thách | ADMIN | CRUD DailyChallenge |

### 4.6. Module Huy hiệu & Leaderboard (Badges & Gamification)

| UC ID | Tên chức năng | Actor | Mô tả |
|-------|--------------|-------|--------|
| UC37 | Xem huy hiệu | STUDENT | Xem badges của mình (earned + locked), loại badge: STREAK, MASTERY, COURSE, SOCIAL, SPECIAL |
| UC38 | Kiếm huy hiệu | System | Tự động cấp Badge khi đạt điều kiện (e.g., 7-day streak, 100 XP, khóa học xong) |
| UC39 | Xem bảng xếp hạng (Leaderboard) | All | Xem top users theo total XP, total streak |

### 4.7. Module Chứng chỉ (Certificates)

| UC ID | Tên chức năng | Actor | Mô tả |
|-------|--------------|-------|--------|
| UC40 | Hoàn thành khóa học | STUDENT | Khi lessonsCompleted == totalLessons → hệ thống tạo Certificate |
| UC41 | Xem chứng chỉ | STUDENT | Xem danh sách certificates (số hiệu, ngày cấp, score, PDF) |
| UC42 | Download chứng chỉ | STUDENT | Download PDF chứng chỉ |
| UC43 | Chia sẻ chứng chỉ | STUDENT | Chia sẻ link verification chứng chỉ |

### 4.8. Module AI Agent (Chatbot & Scoring)

| UC ID | Tên chức năng | Actor | Mô tả |
|-------|--------------|-------|--------|
| UC44 | Chấm điểm bài viết (AI) | STUDENT | Gửi bài viết → AI chấm theo rubric (Grammar, Vocabulary, Coherence, etc.) → ExerciseResult |
| UC45 | Sinh bài tập (AI) | STUDENT | Yêu cầu sinh N bài tập theo topic/level/skill → Groq tạo exercises |
| UC46 | Chat với AI Tutor | STUDENT | Hỏi đáp về grammar, vocabulary, IELTS, TOEIC → ChatMessage (USER/ASSISTANT) |
| UC47 | Nhận hướng dẫn học | STUDENT | AI phân tích UserStats, đề xuất: weak skills, next lessons, recommended exercises |
| UC48 | Lưu lịch sử chat | System | Lưu ChatMessage với type: SCORING, EXERCISE, CHATBOT, GUIDANCE |

### 4.9. Module Phân tích & Thống kê (Analytics)

| UC ID | Tên chức năng | Actor | Mô tả |
|-------|--------------|-------|--------|
| UC49 | Xem thống kê cá nhân | STUDENT | Xem UserStats: totalXp, level, courses enrolled/completed, lessons done, skill scores (Writing/Speaking/Reading/Listening/Grammar/Vocabulary), accuracy |
| UC50 | Xem học liệu (Learning Path) | STUDENT | Xem milestones, suggested exercises, next level goals |
| UC51 | Xem phân tích chi tiết | STUDENT | Chart: score trends, skill comparison, time spent per skill |
| UC52 | Xem thống kê hệ thống | ADMIN | Platform stats: total users, courses, exercises, active users, distribution by level/role |
| UC53 | Xem analytics nâng cao | ADMIN | User growth, engagement, course popularity, AI performance |

### 4.10. Module Cộng đồng & Forum (Community)

| UC ID | Tên chức năng | Actor | Mô tả |
|-------|--------------|-------|--------|
| UC54 | Xem danh sách bài viết | All | Xem ForumPosts, lọc theo category (GRAMMAR, VOCABULARY, SPEAKING, etc.) / level |
| UC55 | Tạo bài viết (Post) | STUDENT | Tạo ForumPost mới (title, content, category, tags, level) |
| UC56 | Bình luận bài viết | STUDENT | Tạo ForumComment (nested replies), đánh dấu accepted answer |
| UC57 | Like/Vote | STUDENT | Thích (like) post/comment |
| UC58 | Ghim bài viết | ADMIN/MENTOR | Ghim ForumPost quan trọng |
| UC59 | Đánh dấu giải pháp | STUDENT | Đánh dấu ForumComment nào là accepted answer |
| UC60 | Mentor trả lời | MENTOR | Mentor trả lời forum với badge isMentorReply=true |

### 4.11. Module Mentor & Coaching

| UC ID | Tên chức năng | Actor | Mô tả |
|-------|--------------|-------|--------|
| UC61 | Yêu cầu mentor | STUDENT | Gửi yêu cầu → tạo MentorAssignment |
| UC62 | Xem danh sách mentor | STUDENT | Xem available mentors |
| UC63 | Chat với mentor | STUDENT/MENTOR | Trao đổi MentorMessage với mentor |
| UC64 | Xem assignment | MENTOR | Xem MentorAssignment được assign |
| UC65 | Gửi feedback | MENTOR | Gửi MentorMessage với feedback chi tiết |
| UC66 | Quản lý mentor | ADMIN | Duyệt, gán mentor, xem performance |

### 4.12. Module Thông báo (Notifications)

| UC ID | Tên chức năng | Actor | Mô tả |
|-------|--------------|-------|--------|
| UC67 | Gửi thông báo | System | Tạo Notification cho user (STUDY_REMINDER, MENTOR_MESSAGE, BADGE_EARNED, LEVEL_UP, etc.) |
| UC68 | Xem thông báo | STUDENT | Xem danh sách notifications |
| UC69 | Đánh dấu đã đọc | STUDENT | Mark notification as read |
| UC70 | Gửi email | System | Gửi email notification (isEmailSent=true) |

### 4.13. Module Quản trị (Admin Management)

| UC ID | Tên chức năng | Actor | Mô tả |
|-------|--------------|-------|--------|
| UC71 | Xem danh sách users | ADMIN | Xem tất cả users, lọc theo role/level |
| UC72 | Thay đổi role user | ADMIN | Cập nhật User.role (STUDENT/TEACHER/ADMIN/MENTOR) |
| UC73 | Thay đổi level user | ADMIN | Cập nhật User.level (A1-C2) |
| UC74 | Xóa user | ADMIN | Xóa User (cascade delete) |
| UC75 | Quản lý khóa học | ADMIN | CRUD Courses, Chapters, Lessons |
| UC76 | Quản lý bài tập | ADMIN | CRUD Exercises |
| UC77 | Quản lý vocabulary | ADMIN | CRUD VocabularyWord, VocabularySets |
| UC78 | Quản lý thách thức | ADMIN | CRUD DailyChallenge |
| UC79 | Quản lý huy hiệu | ADMIN | CRUD Badge |
| UC80 | Xem thống kê hệ thống | ADMIN | View analytics, reports |

---

## 6. Luồng công việc chính (Main Workflows)

### 6.1. Luồng Đăng ký và Bắt đầu học
```
1. Guest → Đăng ký → Tạo User (role=STUDENT, level=A1)
2. User → Làm Placement Test → Hệ thống cập nhật level + placementTestCompleted=true
3. User → Xem khóa học theo level → Đăng ký (Enroll) Course
4. System → Tạo CourseEnrollment + LessonProgress cho tất cả lessons
```

### 6.2. Luồng Làm bài tập và chấm điểm (AI-Grading)
```
1. Student → Xem Exercise
2. Student → Làm bài (gửi userAnswer)
3. System → Gọi AI (Groq API) với system prompt + userAnswer
4. AI → Trả về score (0-100) + feedback + suggestions
5. System → Lưu ExerciseResult (score, feedback, suggestions)
6. System → Cập nhật UserStats (skill scores)
7. Student → Xem kết quả + feedback
```

### 6.3. Luồng Thử thách hàng ngày (Daily Challenge)
```
1. Admin → Tạo DailyChallenge (hôm nay, type, content, xpReward)
2. Student → Xem thử thách hôm nay
3. Student → Làm challenge → UserDailyProgress.currentProgress++
4. Student → Sau khi hoàn thành (currentProgress >= targetGoal):
   - Nhấn "Claim" → UserDailyProgress.claimed=true
   - System → Cộng XP (UserStats.totalXp += xpReward)
   - System → Cập nhật streak (UserStreak.currentStreak++)
   - System → Check badges (e.g., 7-day streak → grant STREAK badge)
5. System → Gửi Notification (XP_EARNED, BADGE_EARNED)
```

### 6.4. Luồng Học từ vựng (Spaced Repetition)
```
1. Student → Xem VocabularyWords (lọc theo level/category)
2. Student → Làm quiz từ vựng
3. System → Cập nhật UserVocabularyProgress theo SM-2 algorithm:
   - Nếu đúng: easeFactor tăng, nextReviewDate = today + interval
   - Nếu sai: easeFactor giảm, nextReviewDate = today + 1 ngày
4. System → Hiển thị từ cần ôn tập (nextReviewDate <= today)
```

### 6.5. Luồng Forum & Mentor Support
```
1. Student → Tạo ForumPost (question)
2. Mentor/Others → Trả lời (ForumComment)
3. Mentor → Đánh dấu as accepted answer
4. Author → Đánh dấu post as solved
5. System → Gửi Notification (FORUM_REPLY)
```

### 6.6. Luồng Mentor Assignment
```
1. Student → Yêu cầu mentor → Tạo MentorAssignment
2. Admin → Gán mentor cho student
3. Mentor → Chat với student (MentorMessage)
4. Mentor → Xem UserStats của student → Đưa ra feedback
5. System → Gửi Notification (MENTOR_MESSAGE, ASSIGNMENT_DUE)
```

---

## 7. Các API Endpoint chính

### Authentication
- `POST /api/auth/register` → Đăng ký
- `POST /api/auth/login` → Đăng nhập
- `POST /api/auth/placement-test` → Làm placement test

### Courses & Lessons
- `GET /api/courses` → Danh sách courses
- `GET /api/courses/{id}` → Chi tiết course
- `POST /api/courses/{id}/enroll` → Đăng ký khóa học
- `GET /api/courses/{id}/chapters` → Danh sách chapters
- `GET /api/lessons/{id}` → Chi tiết lesson
- `POST /api/lessons/{id}/complete` → Hoàn thành lesson

### Exercises
- `GET /api/exercises` → Danh sách exercises (filter by level/skill/type)
- `GET /api/exercises/{id}` → Chi tiết exercise
- `POST /api/exercises/{id}/submit` → Làm bài tập
- `GET /api/exercises/results/my` → Danh sách kết quả

### AI Agent
- `POST /api/agent/score` → Chấm bài (AI)
- `POST /api/agent/generate` → Sinh bài tập (AI)
- `POST /api/agent/chat` → Chat với AI
- `GET /api/agent/guidance` → Nhận hướng dẫn học tập

### Vocabulary
- `GET /api/vocabulary/words` → Danh sách từ vựng
- `GET /api/vocabulary/sets` → Danh sách bộ từ
- `POST /api/vocabulary/review` → Làm quiz từ vựng

### Daily Challenges & Gamification
- `GET /api/daily-challenges/today` → Thử thách hôm nay
- `POST /api/daily-challenges/{id}/progress` → Cập nhật tiến độ
- `POST /api/daily-challenges/{id}/claim` → Yêu cầu XP
- `GET /api/user/stats` → Thống kê cá nhân
- `GET /api/user/badges` → Huy hiệu
- `GET /api/leaderboard` → Bảng xếp hạng

### Forum
- `GET /api/forum/posts` → Danh sách bài viết (filter by category/level)
- `POST /api/forum/posts` → Tạo bài viết
- `POST /api/forum/posts/{id}/comments` → Bình luận
- `POST /api/forum/comments/{id}/like` → Like bình luận

### Mentor
- `GET /api/mentors` → Danh sách mentors
- `POST /api/mentor-assignments` → Yêu cầu mentor
- `GET /api/mentor-messages` → Tin nhắn với mentor
- `POST /api/mentor-messages` → Gửi tin nhắn

### Admin
- `GET /api/admin/users` → Danh sách users
- `PATCH /api/admin/users/{id}/role` → Cập nhật role
- `PATCH /api/admin/users/{id}/level` → Cập nhật level
- `GET /api/admin/analytics` → Thống kê hệ thống
- `GET /api/admin/stats` → Platform stats
- **Vai trò:** Lưu trữ thông tin tài khoản và hồ sơ người dùng
- **Thuộc tính:** id, username, email, password, fullName, avatar, ageGroup, role, level, totalPoints, placementTestCompleted, createdAt
- **Enums:** Role (STUDENT/TEACHER/ADMIN), Level (A1-C2), AgeGroup (CHILD/TEEN/ADULT)
- **Mối quan hệ:** 1 User → N ExerciseResult, CourseEnrollment, UserVocabularyProgress, UserBadge, UserStats, UserStreak, ChatMessage, ForumPost, ForumComment, MentorAssignment, Notification, UserDailyProgress

#### **Course** (Khóa học)
- **Vai trò:** Định nghĩa một khóa học đầy đủ
- **Thuộc tính:** id, title, description, level, thumbnail, instructor, totalLessons, enrolledCount, rating, createdAt
- **Mối quan hệ:** 1 Course → N Chapter, CourseEnrollment, Certificate
- **Cấu trúc:** Course → Chapters → Lessons

#### **Chapter** (Chương học)
- **Vai trò:** Chia nhỏ khóa học thành các chương
- **Thuộc tính:** id, title, description, orderIndex, totalLessons, createdAt
- **Mối quan hệ:** 1 Chapter → N Lesson

#### **Lesson** (Bài học)
- **Vai trò:** Bài học cơ bản (video, audio, đọc, bài tập, quiz)
- **Thuộc tính:** id, title, description, orderIndex, type (VIDEO/AUDIO/READING/EXERCISE/QUIZ), videoUrl, audioUrl, pdfUrl, content, durationMinutes, xpReward, createdAt
- **Mối quan hệ:** 1 Lesson → N LessonProgress

#### **Exercise** (Bài tập)
- **Vai trò:** Bài tập chi tiết có thể làm độc lập hoặc trong khóa học
- **Thuộc tính:** id, title, description, type (MULTIPLE_CHOICE/FILL_IN_BLANK/WRITING/SPEAKING/READING/LISTENING), skill, level, topic, content, answerKey, explanation, createdAt
- **Mối quan hệ:** 1 Exercise → N ExerciseResult

#### **ExerciseResult** (Kết quả bài tập)
- **Vai trò:** Lưu trữ kết quả khi user làm bài tập
- **Thuộc tính:** id, userAnswer, score (0-100), feedback, suggestions, skillType, completedAt
- **Mối quan hệ:** N:1 ExerciseResult → User, Exercise

#### **PlacementTest** & **PlacementQuestion**
- **Vai trò:** Kiểm tra xác định trình độ ban đầu (10 câu)
- **Thuộc tính:** title, targetLevel, totalQuestions, timeLimitMinutes, isActive, questions (nested)
- **PlacementQuestion:** question, skillType, level, options, correctAnswer, explanation, passage, audioUrl, points

#### **VocabularyWord** (Từ vựng)
- **Vai trò:** Quản lý từ vựng
- **Thuộc tính:** id, word, pronunciation, translation, definition, example, partOfSpeech, level, category, audioUrl, imageUrl, isActive, createdAt
- **Mối quan hệ:** 1 VocabularyWord → N UserVocabularyProgress

#### **VocabularySet** (Bộ từ vựng)
- **Vai trò:** Tập hợp các từ vựng
- **Thuộc tính:** id, name, description, level, category, wordCount, isPublic, createdAt

#### **UserVocabularyProgress** (Tiến trình từ vựng - Spaced Repetition)
- **Vai trò:** Theo dõi quá trình học từ vựng với SM-2 algorithm
- **Thuộc tính:** masteryLevel (0-5), nextReviewDate, lastReviewDate, reviewCount, correctCount, incorrectCount, easeFactor (2.5 mặc định), createdAt
- **Mối quan hệ:** N:1 → User, VocabularyWord

#### **DailyChallenge** (Thử thách hàng ngày)
- **Vai trò:** Tạo thử thách hàng ngày để gamification
- **Thuộc tính:** id, challengeDate, type (VOCAB_QUIZ/LISTENING/SPEAKING_SHADOWING/GRAMMAR_SPRINT/READING_SPEED/MIXED), title, content (JSON), level, xpReward, targetGoal, isActive, createdAt
- **Mối quan hệ:** 1 DailyChallenge → N UserDailyProgress

#### **UserDailyProgress** (Tiến trình thử thách hàng ngày)
- **Vai trò:** Theo dõi tiến trình challenge hàng ngày của user
- **Thuộc tính:** currentProgress, completed, claimed, score, timeSpentSeconds, xpEarned, completedAt
- **Mối quan hệ:** N:1 → User, DailyChallenge

#### **Badge** (Huy hiệu)
- **Vai trò:** Định nghĩa huy hiệu (thành tựu)
- **Thuộc tính:** id, name, description, icon, color, type (STREAK/MASTERY/COURSE/SOCIAL/SPECIAL), xpReward, isActive
- **Mối quan hệ:** 1 Badge → N UserBadge

#### **UserBadge** (Huy hiệu của user)
- **Vai trò:** Lưu trữ huy hiệu mà user đã kiếm
- **Thuộc tính:** earnedAt, note
- **Mối quan hệ:** N:1 → User, Badge

#### **UserStreak** (Chuỗi học)
- **Vai trò:** Theo dõi streak học hàng ngày
- **Thuộc tính:** currentStreak, longestStreak, lastActivityDate, weeklyGoal (7), weeklyProgress, totalActiveDays
- **Mối quan hệ:** 1:1 → User

#### **UserStats** (Thống kê người dùng)
- **Vai trò:** Tổng hợp thống kê chi tiết của user
- **Thuộc tính:** totalXp, level, currentStreak, coursesEnrolled, coursesCompleted, lessonsCompleted, exercisesCompleted, vocabularyLearned, speakingSessions, writingSubmissions, forumPosts, totalStudyMinutes, weeklyStudyMinutes, monthlyStudyMinutes, grammarScore, vocabularyScore, speakingScore, listeningScore, readingScore, writingScore, overallAccuracy, updatedAt
- **Mối quan hệ:** 1:1 → User

#### **ChatMessage** (Tin nhắn AI)
- **Vai trò:** Lưu trữ cuộc trò chuyện với AI
- **Thuộc tính:** id, role (USER/ASSISTANT), content, type (SCORING/EXERCISE/CHATBOT/GUIDANCE), createdAt
- **Mối quan hệ:** N:1 → User

#### **ForumPost** (Bài viết forum)
- **Vai trò:** Bài viết trong cộng đồng
- **Thuộc tính:** id, title, content, category (GRAMMAR/VOCABULARY/SPEAKING/LISTENING/READING/WRITING/IELTS/TOEIC/GENERAL), level (A1-C1/ALL), tags, viewCount, likeCount, commentCount, answerCount, isPinned, solved, createdAt, updatedAt
- **Mối quan hệ:** 1 ForumPost → N ForumComment, N:1 → User (author), User (mentor)

#### **ForumComment** (Bình luận forum)
- **Vai trò:** Bình luận lồng nhau trên post
- **Thuộc tính:** id, content, likeCount, isMentorReply, acceptedAnswer, createdAt, updatedAt
- **Mối quan hệ:** N:1 → ForumPost, User (author), ForumComment (parent), 1 → N ForumComment (replies)

#### **MentorAssignment** (Gán mentor)
- **Vai trò:** Gán mentor cho student
- **Thuộc tính:** id, notes, learningGoal, assignedAt, active
- **Mối quan hệ:** N:1 → User (mentor), User (student), 1 → N MentorMessage

#### **MentorMessage** (Tin nhắn mentor)
- **Vai trò:** Giao tiếp giữa mentor và student
- **Thuộc tính:** id, content, sender, receiver, seen, seenAt, createdAt
- **Mối quan hệ:** N:1 → MentorAssignment, User (sender), User (receiver)

#### **Certificate** (Chứng chỉ)
- **Vai trò:** Chứng chỉ hoàn thành khóa học
- **Thuộc tính:** id, certificateNumber (unique), userName, courseName, completionDate, finalScore, totalLessons, lessonsCompleted, pdfUrl, isIssued, issuedAt, createdAt
- **Mối quan hệ:** N:1 → User, Course

#### **CourseEnrollment** (Đăng ký khóa học)
- **Vai trò:** Ghi nhận user đăng ký course
- **Thuộc tính:** id, progressPercent, lessonsCompleted, enrolledAt, completedAt
- **Mối quan hệ:** N:1 → User, Course (unique pair)

#### **LessonProgress** (Tiến trình bài học)
- **Vai trò:** Theo dõi tiến trình từng bài học
- **Thuộc tính:** id, completed, progressPercent, xpEarned, completedAt, lastAccessedAt, createdAt
- **Mối quan hệ:** N:1 → User, Lesson (unique pair)

#### **Notification** (Thông báo)
- **Vai trò:** Thông báo hệ thống cho user
- **Thuộc tính:** id, type (STUDY_REMINDER/MENTOR_MESSAGE/BADGE_EARNED/LEVEL_UP/COURSE_ENROLLMENT/FORUM_REPLY/ASSIGNMENT_DUE/SYSTEM), title, message, link, read, isEmailSent, createdAt
- **Mối quan hệ:** N:1 → User

#### **SocialAccount** (Tài khoản xã hội)
- **Vai trò:** Liên kết OAuth (Google, Facebook)
- **Thuộc tính:** id, provider, providerUserId, accessToken, refreshToken, email, fullName, avatar, linkedAt
- **Mối quan hệ:** N:1 → User
  6. Trả về thông báo thành công
- **Alternative Flow:**
  - 3a. Username đã tồn tại → trả lỗi "Username already taken"
  - 3b. Email đã tồn tại → trả lỗi "Email already in use"
- **Postcondition:** Tài khoản mới được tạo trong DB

### UC02 - Đăng nhập

- **Actor:** Guest
- **Input:** username, password
- **Main Flow:**
  1. User nhập username/password
  2. Hệ thống xác thực qua AuthenticationManager
  3. Tạo JWT token (HS256, có expiration)
  4. Trả về AuthResponse: token, id, username, email, fullName, level, role, totalPoints, ageGroup, placementTestCompleted
- **Alternative Flow:**
  - 2a. Sai thông tin → trả lỗi "Invalid username or password"
- **Postcondition:** User nhận được JWT token để truy cập các API protected

### UC03 - Làm bài kiểm tra phân loại (Placement Test)

- **Actor:** STUDENT (authenticated)
- **Main Flow:**
  1. User request GET /api/placement-test → nhận 10 câu hỏi (A1-C1)
  2. User làm bài và submit: correctAnswers, totalQuestions, recommendedLevel
  3. Hệ thống tính level dựa trên:
     - Nếu có recommendedLevel hợp lệ → dùng trực tiếp
     - Nếu không → tính theo tỷ lệ đúng: ≥85%→C1, ≥70%→B2, ≥55%→B1, ≥40%→A2, <40%→A1
  4. Cập nhật user.level và user.placementTestCompleted = true
  5. Trả về AuthResponse cập nhật
- **Postcondition:** User có level phù hợp, placement test đã hoàn thành

### UC13 - Chấm điểm bài làm (AI Scoring)

- **Actor:** STUDENT (authenticated)
- **Input:** skillType, userText, question, correctAnswer, exerciseId
- **Main Flow:**
  1. User submit bài làm qua POST /api/agent/score
  2. Nếu Groq API available:
     - Gửi prompt với rubric cho AI chấm điểm
     - Parse JSON response: score, criteria, feedback, improvement
  3. Nếu Groq unavailable → Fallback rule-based:
     - WRITING: Grammar(0-3) + Vocabulary(0-2) + Coherence(0-2) + TaskResponse(0-3)
     - SPEAKING: Fluency(0-3) + Pronunciation(0-2) + Grammar(0-2) + Vocabulary(0-3)
     - READING/LISTENING: Accuracy(0-10) dựa trên so sánh đáp án
  4. Lưu ExerciseResult vào DB
  5. Cập nhật user.totalPoints += score * 10
  6. Trả về ScoringResponse
- **Postcondition:** Kết quả được lưu, user points cập nhật

### UC14 - Sinh bài tập tự động (AI Exercise Generation)

- **Actor:** STUDENT (authenticated)
- **Input:** topic, level, skill, type, count (max 10)
- **Main Flow:**
  1. User request POST /api/agent/generate
  2. Nếu Groq available → AI sinh câu hỏi theo prompt
  3. Nếu Groq unavailable → dùng question pool hoặc template
  4. Trả về ExerciseGenerationResponse: list of QuestionItem (number, question, options, correctAnswer, explanation)
- **Postcondition:** Bài tập được sinh và trả về cho user

### UC15 - Chat với AI Tutor

- **Actor:** STUDENT (authenticated)
- **Input:** message, sessionType
- **Main Flow:**
  1. User gửi message qua POST /api/agent/chat
  2. Nếu Groq available → AI trả lời bằng tiếng Việt kèm ví dụ tiếng Anh
  3. Nếu Groq unavailable → rule-based response dựa trên keywords (present simple, past simple, vocabulary, IELTS, TOEIC...)
  4. Trả về ChatResponse: message, examples, tip
- **Postcondition:** User nhận được câu trả lời từ AI Tutor

### UC16 - Nhận hướng dẫn học tập (AI Guidance)

- **Actor:** STUDENT (authenticated)
- **Main Flow:**
  1. User request GET /api/agent/guidance
  2. Hệ thống tính điểm TB từng kỹ năng (WRITING, SPEAKING, READING, LISTENING)
  3. Xác định kỹ năng yếu (score < 6.0)
  4. Sinh recommendations dựa trên weaknesses
  5. Trả về GuidanceResponse: summary, weaknesses, recommendations, nextLesson, skillScores
- **Postcondition:** User nhận được phân tích và đề xuất học tập

---

## 5. Yêu cầu phi chức năng

| Yêu cầu | Mô tả |
|----------|--------|
| **Bảo mật** | JWT Authentication, BCrypt password encoding, Role-based access control (RBAC) |
| **Hiệu năng** | Stateless session, API response < 2s (rule-based), < 5s (AI-powered) |
| **Khả dụng** | Dockerized deployment, Nginx reverse proxy |
| **Mở rộng** | AI fallback mechanism: AI unavailable → rule-based fallback |
| **Tương thích** | CORS support cho multiple origins |
| **Đa ngôn ngữ** | Hỗ trợ feedback bằng tiếng Việt và tiếng Anh |

---

## 6. API Endpoints

### Authentication
| Method | URL | Auth | Mô tả |
|--------|-----|------|--------|
| POST | /api/auth/register | No | Đăng ký |
| POST | /api/auth/login | No | Đăng nhập |

### Placement Test
| Method | URL | Auth | Mô tả |
|--------|-----|------|--------|
| GET | /api/placement-test | Yes | Lấy đề kiểm tra |
| POST | /api/placement-test/submit | Yes | Nộp bài kiểm tra |

### Courses
| Method | URL | Auth | Mô tả |
|--------|-----|------|--------|
| GET | /api/courses | No | Lấy DS khóa học |
| GET | /api/courses/{id} | No | Chi tiết khóa học |
| GET | /api/profile | Yes | Thông tin cá nhân |

### Exercises
| Method | URL | Auth | Mô tả |
|--------|-----|------|--------|
| GET | /api/exercises | No | DS bài tập |
| GET | /api/exercises/{id} | No | Chi tiết bài tập |
| POST | /api/exercises | TEACHER/ADMIN | Tạo bài tập |
| PUT | /api/exercises/{id} | TEACHER/ADMIN | Sửa bài tập |
| DELETE | /api/exercises/{id} | ADMIN | Xóa bài tập |

### AI Agent
| Method | URL | Auth | Mô tả |
|--------|-----|------|--------|
| POST | /api/agent/score | Yes | Chấm điểm AI |
| POST | /api/agent/generate | Yes | Sinh bài tập AI |
| POST | /api/agent/chat | Yes | Chat AI Tutor |
| GET | /api/agent/guidance | Yes | Hướng dẫn học tập |

### Results
| Method | URL | Auth | Mô tả |
|--------|-----|------|--------|
| GET | /api/results | Yes | Kết quả bài làm |

### Learning Path
| Method | URL | Auth | Mô tả |
|--------|-----|------|--------|
| GET | /api/learning-path | Yes | Lộ trình học tập |

### Analytics
| Method | URL | Auth | Mô tả |
|--------|-----|------|--------|
| GET | /api/analytics | Yes | Phân tích cá nhân |
| GET | /api/analytics/admin | ADMIN | Phân tích toàn hệ thống |

### Admin
| Method | URL | Auth | Mô tả |
|--------|-----|------|--------|
| GET | /api/admin/users | ADMIN | DS users |
| PUT | /api/admin/users/{id}/role | ADMIN | Đổi role |
| PUT | /api/admin/users/{id}/level | ADMIN | Đổi level |
| DELETE | /api/admin/users/{id} | ADMIN | Xóa user |
| GET | /api/admin/stats | ADMIN | Thống kê hệ thống |
| POST | /api/admin/courses | ADMIN | Tạo khóa học |
| DELETE | /api/admin/courses/{id} | ADMIN | Xóa khóa học |
