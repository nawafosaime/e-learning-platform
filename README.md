# e-learning-platform
A full-stack web application for offering interactive lessons, quizzes, and progress tracking.

## 1) Overview
This project is an **E-Learning Platform**

It allows:

- **Doctors** to create courses and manage lessons and quizzes
- **Students** to enroll in courses
- **Students** to complete lessons and take quizzes
- **The system** to track progress and suggest weak topics after quizzes

### Distinguishing Feature
The special feature in this project is the **Weak Topic Tracker**.  
After each quiz, the platform detects the topics where the student made mistakes and shows recommended review topics.

## 2) Goals

- Build a real web application from scratch
- Use semantic HTML and clean CSS
- Use raw JavaScript with ES6 classes
- Use Node.js + Express on the backend
- Use MongoDB for persistent data
- Protect website pages using authentication
- Practice GitHub teamwork and project documentation


## 3) Technologies Used

- HTML5
- CSS3
- Bootstrap 5
- Raw JavaScript (ES6 classes)
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT authentication with cookies

## 4) Main Features

### Student Features
- Register and login
- View available courses
- Enroll in a course
- Read lessons
- Mark lessons as completed
- Take quizzes
- View personal progress
- View weak topic suggestions

### Doctor Features
- Register and login
- Create courses
- Add, edit, and delete lessons
- Add, edit, and delete quizzes
- Preview quizzes
- View students' course progress through the API

## 5) System Flow
```text
Start
  ↓
User registers or logs in
  ↓
System checks role
  ├── Doctor
  │     ↓
  │   Create/manage course
  │     ↓
  │   Add lessons and quizzes
  │
  └── Student
        ↓
      Browse courses
        ↓
      Enroll in course
        ↓
      Study lessons
        ↓
      Take quiz
        ↓
      Track progress + weak topics
```
## 6) Setup Instructions

### Requirements
- Node.js 18+ 

### Installation
```bash
npm install
cp .env.example .env
```

### Start the application
```bash
npm run dev
```

Open:
```text
http://localhost:3000
```

### Seed sample data
```bash
npm run seed
```

Demo accounts after seeding:
- Doctor: `doctor@example.com` / `Password123`
- Student: `student@example.com` / `Password123`

## 7) Future Work

- Add course search and filters
- Add quiz results history page
- Add pagination for large course lists
- Add file uploads for lesson materials
- Add richer analytics charts

## 8) Project Structure
```text
e-learning-platform/
├── public/
│   ├── css/
│   └── js/
├── scripts/
├── src/
│   ├── config/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── utils/
├── views/
├── server.js
├── package.json
└── README.md
```

## 9) REST API 

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Courses
- `GET /api/courses`
- `POST /api/courses`
- `GET /api/courses/:courseId`
- `PATCH /api/courses/:courseId`
- `DELETE /api/courses/:courseId`
- `POST /api/courses/:courseId/enroll`

### Lessons
- `GET /api/courses/:courseId/lessons`
- `POST /api/courses/:courseId/lessons`
- `PATCH /api/lessons/:lessonId`
- `DELETE /api/lessons/:lessonId`
- `POST /api/lessons/:lessonId/complete`

### Quizzes
- `GET /api/courses/:courseId/quizzes`
- `POST /api/courses/:courseId/quizzes`
- `GET /api/quizzes/:quizId`
- `PATCH /api/quizzes/:quizId`
- `DELETE /api/quizzes/:quizId`
- `POST /api/quizzes/:quizId/submit`

### Progress
- `GET /api/progress/me`


## 10) Resources

- Course lecture notes
- Node.js documentation
- Express documentation
- MongoDB documentation
- Bootstrap documentation

## 11) Team Members

- Nawaf Naif Alotaibi
- Abdulrahman alodhaib
- Yazeed Alabdullatif
- Ali Rashed Almajed