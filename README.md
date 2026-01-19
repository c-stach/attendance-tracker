# attendance-tracker

## App Overview

The Attendance Tracker is a client-side web application designed to help instructors manage class rosters and record daily attendance. The app allows users to:

* Add students to specific classes or sections
* Take attendance for a selected class on a selected date
* View attendance history through a monthly calendar overview
* See per-day summaries, including attendance percentages and individual student status

The interface is organized into three main views: Overview (calendar), Add Students, and Take Attendance, accessible through a top navigation bar. The application runs entirely in the browser and does not require a backend or database.

---

## Key Design Decisions and Assumptions

* Single-page application (SPA) behavior is implemented using JavaScript to show and hide sections instead of navigating between pages.
* All data is assumed to be managed by a single user (e.g., one instructor) in one browser session.
* Student names are treated as unique identifiers within a class for attendance tracking.
* Attendance is binary (Present or Absent) and recorded via checkboxes.
* The FullCalendar library is used to provide a familiar and intuitive calendar-based overview of attendance data.
* The UI design is inspired by Canvas-style learning management systems, prioritizing clarity and minimalism.

---

## How Data Is Stored

All data is stored in memory using JavaScript objects during the browser session.

* Classes and students are stored in:
  state.classes
  Format:
  {
  "Class Name": [
  { name: "Student Name", id: "Optional ID or Email" }
  ]
  }

* Attendance records are stored in:
  state.attendance
  Format:
  {
  "YYYY-MM-DD": {
  "Class Name": {
  "Student Name": true/false
  }
  }
  }

No data persistence (e.g., localStorage or database storage) is implemented. Reloading the page clears all data.

---

## Extra Features Implemented

* Calendar Integration:
  Attendance dates are visually highlighted on a monthly calendar using FullCalendar.

* Attendance Summary View:
  Clicking a date in the calendar displays:

  * Attendance percentage for each class
  * Number of students present vs. total
  * Individual student presence (P/A)

* Autocomplete for Student Names:
  When adding students, previously entered student names appear as suggestions to reduce duplicate typing.

* Dynamic UI Updates:
  Class dropdowns, student lists, and attendance lists update automatically when data changes.

* Visual Date Selection:
  The selected calendar day is highlighted for better user feedback.

---

## End of README
