# Phase D — Attendance & Scheduling (Module 5 MVP)

## Roll-call

Create a session (auto-marks all class students `PRESENT`):

```http
POST /api/v1/attendance/sessions
Authorization: Bearer <token>
Permission: attendance.record.manage

{
  "classLevelId": "<uuid>",
  "sessionDate": "2026-05-21",
  "notes": "Morning register"
}
```

Update marks:

```http
PUT /api/v1/attendance/sessions/:sessionId/records

{
  "records": [
    { "studentId": "<uuid>", "status": "ABSENT", "remark": "Sick" },
    { "studentId": "<uuid>", "status": "LATE" }
  ]
}
```

Statuses: `PRESENT`, `ABSENT`, `LATE`, `EXCUSED`.

## Reports

| Method | Path | Permission |
|--------|------|------------|
| GET | `/attendance/sessions` | `attendance.report.read` |
| GET | `/attendance/sessions/:sessionId` | `attendance.report.read` |
| GET | `/attendance/students/:studentId/history` | `attendance.report.read` |
| GET | `/attendance/classes/:classLevelId/summary` | `attendance.report.read` |

Query params: `from`, `to`, `classLevelId`, `campusId`, `tier`.

## Timetable

`dayOfWeek`: 1 = Monday … 7 = Sunday.  
`startMinutes` / `endMinutes`: minutes from midnight (e.g. 480 = 08:00, 540 = 09:00).

```http
POST /api/v1/attendance/timetable/slots
Permission: attendance.timetable.manage

{
  "classLevelId": "<uuid>",
  "teacherId": "<uuid>",
  "subjectId": "<uuid>",
  "dayOfWeek": 1,
  "startMinutes": 480,
  "endMinutes": 540,
  "room": "Room 12",
  "campusId": "<uuid>",
  "tier": "PRIMARY"
}
```

Conflict check before save: `GET /attendance/timetable/conflicts?teacherId=&dayOfWeek=1&startMinutes=480&endMinutes=540`

## Substitutions

```http
POST /api/v1/attendance/timetable/substitutions

{
  "timetableSlotId": "<uuid>",
  "substituteTeacherId": "<uuid>",
  "effectiveDate": "2026-05-22",
  "reason": "Medical leave"
}
```

## Door log import

```http
POST /api/v1/attendance/door-imports
Permission: attendance.record.manage

{
  "campusId": "<uuid>",
  "source": "main_gate",
  "entries": [
    { "studentId": "<uuid>", "scannedAt": "2026-05-21T08:05:00Z", "gate": "A" },
    { "externalId": "STU-2024-001", "scannedAt": "2026-05-21T08:06:00Z" }
  ]
}
```

Matches `externalId` to `Student.studentId` or student `id`.

## Migration

```sh
npm run db:migrate
```

Adds `TimetableSlot`, `TimetableSubstitution`, `AttendanceSession`, `AttendanceRecord`, `AttendanceDoorImport`, `AttendanceDoorEntry`.
