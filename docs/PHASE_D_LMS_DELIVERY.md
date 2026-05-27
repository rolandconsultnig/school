# Phase D — LMS (Module 6 MVP)

Extends legacy exams with **courses**, **assignments**, **live class links**, and a **gradebook** that blends exam results + assignment scores.

## Courses

```http
POST /api/v1/lms/courses
Permission: lms.course.manage

{
  "title": "Primary 4 Mathematics",
  "subjectId": "<uuid>",
  "classLevelId": "<uuid>",
  "teacherId": "<uuid>",
  "academicTermId": "<uuid>",
  "campusId": "<uuid>",
  "tier": "PRIMARY",
  "isPublished": true
}
```

Auto-enrolls all students in `classLevelId` when the course is created.

| Method | Path |
|--------|------|
| GET | `/lms/courses` |
| GET | `/lms/courses/:courseId` |
| PATCH | `/lms/courses/:courseId` |
| POST | `/lms/courses/:courseId/enroll` `{ "studentIds": ["..."] }` |

## Assignments

```http
POST /api/v1/lms/courses/:courseId/assignments
Permission: lms.assignment.manage

{
  "title": "Week 3 Homework",
  "type": "HOMEWORK",
  "maxScore": 20,
  "dueAt": "2026-06-01T23:59:00Z",
  "isPublished": true
}
```

**Student submit** (JWT student token):

```http
POST /api/v1/lms/assignments/:assignmentId/submit
{ "contentText": "My answer...", "contentUrl": "https://..." }
```

**Grade submission:**

```http
PATCH /api/v1/lms/submissions/:submissionId/grade
{ "score": 18, "feedback": "Well done" }
```

## Live classes

```http
POST /api/v1/lms/courses/:courseId/live-sessions

{
  "title": "Math live class",
  "meetingUrl": "https://meet.google.com/abc-defg-hij",
  "scheduledAt": "2026-05-22T09:00:00Z",
  "durationMin": 45
}
```

## Gradebook

| Method | Path | Who |
|--------|------|-----|
| GET | `/lms/courses/:courseId/gradebook` | Staff (`lms.grade.read`) |
| GET | `/lms/student/gradebook` | Student |
| GET | `/lms/students/:studentId/gradebook` | Staff |

Returns per-student: exam average (published `ExamResult` for course subject/class), assignment average, overall %.

## Student portal

| GET | `/lms/student/courses` | Enrolled published courses + live sessions |

## Migration

```sh
npm run db:migrate
npm run db:seed
```
