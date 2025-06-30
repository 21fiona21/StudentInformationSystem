'use client'

// SQL Editor component for running queries and viewing results in the UI

import { useState } from 'react'

export default function SqlEditor() {
  // State for SQL query text entered by user or from template
  const [query, setQuery] = useState('')
  // State for result data returned from API (array of rows or null)
  const [result, setResult] = useState<any>(null)
  // State for error messages from API or validation
  const [error, setError] = useState<string | null>(null)
  // State for success messages (e.g., no rows returned)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  /**
   * Executes the SQL query by sending it to the backend API.
   * Handles clearing previous results, catching errors, and setting result state.
   */
  const handleRunQuery = async () => {
    // Clear previous feedback and results
    setSuccessMessage(null)
    setError(null)
    setResult(null)

    try {
      // Send SQL query to /api/sql endpoint as JSON
      const response = await fetch('/api/sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      // Parse JSON response
      const json = await response.json()
      // Throw error if response is not OK
      if (!response.ok) throw new Error(json.error || 'Unknown error')

      // Set result data for display
      setResult(json.data)
      // If query succeeded but no rows returned, show a success message
      if (Array.isArray(json.data) && json.data.length === 0) {
        setSuccessMessage('✅ Query executed successfully (no rows returned)')
      } else {
        setSuccessMessage(null)
      }
    } catch (err: any) {
      // Show error message if API call fails
      setError(err.message)
    }
  }

  return (
    <div className="space-y-4">
      {/* --- Section: Database structure image --- */}
      <details className="bg-yellow-50 border border-yellow-200 rounded p-4">
        <summary className="cursor-pointer text-yellow-700 font-semibold mb-2">
          🗂️ Database Structure
        </summary>
        <div className="mt-4">
          <img
            src="/images/db-overview.jpeg"
            alt="Database Overview"
            className="w-full max-w-3xl mx-auto rounded shadow"
          />
        </div>
      </details>
      {/* --- Section: SQL query templates grouped in buttons --- */}
      <details className="bg-blue-50 border border-blue-200 rounded p-4">
        <summary className="cursor-pointer text-blue-700 font-semibold mb-2">
          📋 Useful SQL Query Templates
        </summary>
        <div className="space-y-2 mt-2">
          {/* --- Student Management query templates --- */}
          <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">👩‍🎓 Student Management</h3>
          <div className="grid grid-cols-4 gap-4">
            {/* Render Student Management template buttons */}
            {[
              { label: 'Students not fulfilling ECTS requirement (<16 ECTS)', bg: 'bg-red-100', hover: 'hover:bg-red-200', query: `
SELECT
  s.id AS student_id,
  s.first_name,
  s.last_name,
  COALESCE(SUM(c.ects), 0) AS total_ects
FROM
  students s
LEFT JOIN
  enrollments e ON s.id = e.student_id
LEFT JOIN
  courses c ON e.course_id = c.id
GROUP BY
  s.id, s.first_name, s.last_name
HAVING
  COALESCE(SUM(c.ects), 0) < 16;
  ` },
              {
                label: 'Students not fulfilling language requirements (<6 ECTS 🇬🇧 or <6 ECTS 🇩🇪)',
                bg: 'bg-blue-100',
                hover: 'hover:bg-blue-200',
                query: `
SELECT
  s.id AS student_id,
  s.first_name,
  s.last_name,
  COALESCE(SUM(CASE WHEN LOWER(c.language) = 'english' THEN c.ects ELSE 0 END), 0) AS ects_english,
  COALESCE(SUM(CASE WHEN LOWER(c.language) = 'german' THEN c.ects ELSE 0 END), 0) AS ects_german
FROM
  students s
JOIN
  enrollments e ON s.id = e.student_id
JOIN
  courses c ON e.course_id = c.id
GROUP BY
  s.id, s.first_name, s.last_name
HAVING
  COALESCE(SUM(CASE WHEN LOWER(c.language) = 'english' THEN c.ects ELSE 0 END), 0) < 6
  OR COALESCE(SUM(CASE WHEN LOWER(c.language) = 'german' THEN c.ects ELSE 0 END), 0) < 6;
  `.trim()
              },
              {
                label: 'Students with current GPA <4.00',
                bg: 'bg-green-100',
                hover: 'hover:bg-green-200',
                query: `
SELECT
  s.id AS student_id,
  s.first_name,
  s.last_name,
  ROUND(SUM(c.ects * e.grade)::numeric / NULLIF(SUM(c.ects), 0), 2) AS gpa
FROM
  students s
JOIN
  enrollments e ON s.id = e.student_id
JOIN
  courses c ON e.course_id = c.id
WHERE
  e.grade IS NOT NULL
GROUP BY
  s.id, s.first_name, s.last_name
HAVING
  (SUM(c.ects * e.grade) / NULLIF(SUM(c.ects), 0)) < 4.00;
                `.trim()
              },
              {
                label: 'Course list by student ID',
                bg: 'bg-yellow-100',
                hover: 'hover:bg-yellow-200',
                query: `
-- Enter student ID in placeholder below
SELECT
  c.id AS course_id,
  c.course_name,
  c.lecturer_id,
  c.ects,
  c.language,
  e.enrollment_date,
  COALESCE(e.grade::text, 'not assigned yet') AS grade
FROM
  enrollments e
JOIN
  courses c ON e.course_id = c.id
WHERE
  e.student_id = ‼️PUT STUDENT ID HERE‼️;
                `.trim()
              },
            ].map((template, index) => (
              <button
                key={index}
                className={`${template.bg} text-gray-800 px-4 py-6 rounded shadow ${template.hover} transition text-sm text-center whitespace-normal break-words h-32 flex items-center justify-center`}
                onClick={() => setQuery((template.query || '-- SQL query for: ' + template.label).trim())}
              >
                {template.label}
              </button>
            ))}
          </div>
          <div className="h-4"></div>

          {/* --- Lecturer Management query templates --- */}
          <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">👨‍🏫 Lecturer Management</h3>
          <div className="grid grid-cols-4 gap-4">
            {/* Render Lecturer Management template buttons */}
            {[
              {
                label: 'Lecturer Overview',
                bg: 'bg-purple-100',
                hover: 'hover:bg-purple-200',
                query: `
SELECT
  l.id AS lecturer_id,
  l.first_name,
  l.last_name,
  COUNT(DISTINCT c.id) AS number_of_courses,
  COUNT(e.student_id) AS total_enrollments,
  COALESCE(SUM(c.ects), 0) AS total_ects,
  COALESCE(SUM(CASE WHEN LOWER(c.language) = 'english' THEN c.ects ELSE 0 END), 0) AS ects_english,
  COALESCE(SUM(CASE WHEN LOWER(c.language) = 'german' THEN c.ects ELSE 0 END), 0) AS ects_german,
  COALESCE(SUM(CASE WHEN LOWER(c.format) = 'campus' THEN c.ects ELSE 0 END), 0) AS ects_campus,
  COALESCE(SUM(CASE WHEN LOWER(c.format) = 'online' THEN c.ects ELSE 0 END), 0) AS ects_online,
  COALESCE(SUM(CASE WHEN LOWER(c.format) = 'blended' THEN c.ects ELSE 0 END), 0) AS ects_blended
FROM
  lecturers l
LEFT JOIN
  courses c ON l.id = c.lecturer_id
LEFT JOIN
  enrollments e ON c.id = e.course_id
GROUP BY
  l.id, l.first_name, l.last_name;
                `.trim()
              },
              // Add 3 more buttons here as needed for a total of 4 in the row
              {
                label: 'Grading Progress by Lecturer ID',
                bg: 'bg-green-100',
                hover: 'hover:bg-green-200',
                query: `
-- Enter lecturer ID in placeholder below
SELECT
  c.id AS course_id,
  c.course_name,
  c.ects,
  CONCAT(COUNT(e.grade), '/', COUNT(e.*)) AS grading_progress,
  ROUND(COUNT(e.grade) * 100.0 / NULLIF(COUNT(e.*), 0)) || ' %' AS grading_progress_percentage
FROM
  courses c
JOIN
  enrollments e ON c.id = e.course_id
WHERE
  c.lecturer_id = ‼️PUT LECTURER ID HERE‼️
GROUP BY
  c.id, c.course_name, c.ects;
                `.trim()
              },
              {
                label: 'Grading Distribution by Lecturer ID',
                bg: 'bg-yellow-100',
                hover: 'hover:bg-yellow-200',
                query: `
-- Enter lecturer ID in placeholder below
SELECT
  c.id AS course_id,
  c.course_name,
  COUNT(CASE WHEN e.grade BETWEEN 1.00 AND 1.75 THEN 1 END) AS "1.00 - 1.75",
  COUNT(CASE WHEN e.grade BETWEEN 2.00 AND 2.75 THEN 1 END) AS "2.00 - 2.75",
  COUNT(CASE WHEN e.grade BETWEEN 3.00 AND 3.75 THEN 1 END) AS "3.00 - 3.75",
  COUNT(CASE WHEN e.grade BETWEEN 4.00 AND 4.75 THEN 1 END) AS "4.00 - 4.75",
  COUNT(CASE WHEN e.grade BETWEEN 5.00 AND 5.75 THEN 1 END) AS "5.00 - 5.75",
  COUNT(CASE WHEN e.grade = 6.00 THEN 1 END) AS "6.00"
FROM
  courses c
JOIN
  enrollments e ON c.id = e.course_id
WHERE
  c.lecturer_id = ‼️PUT LECTURER ID HERE‼️
GROUP BY
  c.id, c.course_name;
                `.trim()
              },
              {
                label: 'Course List by Lecturer ID',
                bg: 'bg-blue-100',
                hover: 'hover:bg-blue-200',
                query: `
-- Enter lecturer ID in placeholder below
SELECT
  c.id AS course_id,
  c.course_name,
  c.ects,
  c.format,
  c.language,
  c.max_participants,
  COUNT(e.enrollment_id) AS enrollments
FROM
  courses c
LEFT JOIN
  enrollments e ON c.id = e.course_id
WHERE
  c.lecturer_id = ‼️PUT LECTURER ID HERE‼️
GROUP BY
  c.id, c.course_name, c.ects, c.format, c.language, c.max_participants;
  `.trim()
              },
            ].map((template, index) => (
              <button
                key={index}
                className={`${template.bg || 'bg-gray-100'} text-gray-800 px-4 py-6 rounded shadow ${template.hover || ''} transition text-sm text-center whitespace-normal break-words h-32 flex items-center justify-center`}
                onClick={() => template.query && setQuery((template.query || '-- SQL query for: ' + template.label).trim())}
                disabled={!template.label}
              >
                {template.label || <span className="text-gray-400">Coming soon</span>}
              </button>
            ))}
          </div>
          <div className="h-4"></div>

          {/* --- Messages query templates --- */}
          <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">📬 Messages</h3>
          <div className="grid grid-cols-4 gap-4">
            {/* Render Messages template buttons */}
            {[
              {
                label: 'Admin Inbox (All Messages)',
                bg: 'bg-pink-100',
                hover: 'hover:bg-pink-200',
                query: `
SELECT
  id,
  sender_role,
  sender_id,
  title,
  content,
  is_read,
  created_at
FROM
  messages
WHERE
  receiver_role = 'admin'
ORDER BY
  created_at DESC;
                `.trim()
              },
              {
                label: 'Mark all messages to admin as read',
                bg: 'bg-green-100',
                hover: 'hover:bg-green-200',
                query: `
UPDATE messages
SET is_read = TRUE
WHERE receiver_role = 'admin';
                `.trim()
              },
              {
                label: 'New Message (Admin to User)',
                bg: 'bg-yellow-100',
                hover: 'hover:bg-yellow-200',
                query: `
-- Enter receiver ID, receiver role, title, and content below
INSERT INTO messages (
  sender_id,
  sender_role,
  receiver_id,
  receiver_role,
  title,
  content,
  is_read,
  created_at
)
VALUES (
  1,
  'admin',
  ‼️PUT RECEIVER ID HERE‼️,
  '‼️PUT RECEIVER ROLE HERE‼️',
  '‼️PUT TITLE HERE‼️',
  '‼️PUT CONTENT HERE‼️',
  FALSE,
  NOW()
);
                `.trim()
              },
              {
                label: 'Admin Sent Messages',
                bg: 'bg-blue-100',
                hover: 'hover:bg-blue-200',
                query: `
SELECT
  id,
  receiver_role,
  receiver_id,
  title,
  content,
  is_read,
  created_at
FROM
  messages
WHERE
  sender_role = 'admin'
ORDER BY
  created_at DESC;
                `.trim()
              },
              {
                label: 'Message to Course by Course ID (Students)',
                bg: 'bg-purple-100',
                hover: 'hover:bg-purple-200',
                query: `
-- Enter course ID, title, and content below
INSERT INTO messages (
  sender_id,
  sender_role,
  receiver_id,
  receiver_role,
  title,
  content,
  is_read,
  created_at
)
SELECT
  1,
  'admin',
  e.student_id,
  'student',
  '‼️PUT TITLE HERE‼️',
  '‼️PUT CONTENT HERE‼️',
  FALSE,
  NOW()
FROM
  enrollments e
WHERE
  e.course_id = ‼️PUT COURSE ID HERE‼️;
                `.trim()
              },
              {
                label: 'Message to students not fulfilling ECTS (<16)',
                bg: 'bg-red-100',
                hover: 'hover:bg-red-200',
                query: `
-- Enter title and content below
INSERT INTO messages (
  sender_id,
  sender_role,
  receiver_id,
  receiver_role,
  title,
  content,
  is_read,
  created_at
)
SELECT
  1,
  'admin',
  s.id,
  'student',
  '‼️PUT TITLE HERE‼️',
  '‼️PUT CONTENT HERE‼️',
  FALSE,
  NOW()
FROM
  students s
LEFT JOIN
  enrollments e ON s.id = e.student_id
LEFT JOIN
  courses c ON e.course_id = c.id
GROUP BY
  s.id
HAVING
  COALESCE(SUM(c.ects), 0) < 16;
                `.trim()
              },
              {
                label: 'Message to students not fulfilling language requirement (<6 🇬🇧 or <6 🇩🇪)',
                bg: 'bg-blue-100',
                hover: 'hover:bg-blue-200',
                query: `
-- Enter title and content below
INSERT INTO messages (
  sender_id,
  sender_role,
  receiver_id,
  receiver_role,
  title,
  content,
  is_read,
  created_at
)
SELECT
  1,
  'admin',
  s.id,
  'student',
  '‼️PUT TITLE HERE‼️',
  '‼️PUT CONTENT HERE‼️',
  FALSE,
  NOW()
FROM
  students s
JOIN
  enrollments e ON s.id = e.student_id
JOIN
  courses c ON e.course_id = c.id
GROUP BY
  s.id
HAVING
  COALESCE(SUM(CASE WHEN LOWER(c.language) = 'english' THEN c.ects ELSE 0 END), 0) < 6
  OR COALESCE(SUM(CASE WHEN LOWER(c.language) = 'german' THEN c.ects ELSE 0 END), 0) < 6;
                `.trim()
              },
              {
                label: 'Message to all users by role',
                bg: 'bg-purple-100',
                hover: 'hover:bg-purple-200',
                query: `
-- Enter role ('student' or 'lecturer'), title, and content below
INSERT INTO messages (
  sender_id,
  sender_role,
  receiver_id,
  receiver_role,
  title,
  content,
  is_read,
  created_at
)
SELECT
  1,
  'admin',
  u.id,
  '‼️PUT ROLE HERE‼️',
  '‼️PUT TITLE HERE‼️',
  '‼️PUT CONTENT HERE‼️',
  FALSE,
  NOW()
FROM
  (
    SELECT id FROM students WHERE '‼️PUT ROLE HERE‼️' = 'student'
    UNION ALL
    SELECT id FROM lecturers WHERE '‼️PUT ROLE HERE‼️' = 'lecturer'
  ) u;
  `.trim()
              },
            ].map((template, index) => (
              <button
                key={index}
                className={`${template.bg} text-gray-800 px-4 py-6 rounded shadow ${template.hover} transition text-sm text-center whitespace-normal break-words h-32 flex items-center justify-center`}
                onClick={() =>
                  template.query
                    ? setQuery((template.query || '-- SQL query for: ' + template.label).trim())
                    : undefined
                }
              >
                {template.label}
              </button>
            ))}
          </div>
          <div className="h-4"></div>

          {/* --- Timetables query templates --- */}
          <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">📆 Timetables</h3>
          <div className="grid grid-cols-4 gap-4">
            {/* Render Timetables template buttons */}
            {[
              {
                label: 'Timetable by Student ID',
                bg: 'bg-pink-100',
                hover: 'hover:bg-pink-200',
                query: `
-- Enter student ID below
SELECT
  CONCAT(TO_CHAR(ts.start_time, 'HH24:MI'), ' - ', TO_CHAR(ts.end_time, 'HH24:MI')) AS time_slot,
  MAX(CASE WHEN sub.weekday = 'Monday' THEN sched ELSE NULL END) AS Monday,
  MAX(CASE WHEN sub.weekday = 'Tuesday' THEN sched ELSE NULL END) AS Tuesday,
  MAX(CASE WHEN sub.weekday = 'Wednesday' THEN sched ELSE NULL END) AS Wednesday,
  MAX(CASE WHEN sub.weekday = 'Thursday' THEN sched ELSE NULL END) AS Thursday,
  MAX(CASE WHEN sub.weekday = 'Friday' THEN sched ELSE NULL END) AS Friday
FROM (
  SELECT
    cs.weekday,
    CONCAT(TO_CHAR(ts.start_time, 'HH24:MI'), ' - ', TO_CHAR(ts.end_time, 'HH24:MI')) AS label,
    'course: ' || c.id || ' - ' || c.course_name || ', room: ' || r.name AS sched
  FROM
    course_schedule cs
  JOIN courses c ON cs.course_id = c.id
  JOIN enrollments e ON c.id = e.course_id
  JOIN rooms r ON cs.room_id = r.id
  JOIN timeslots ts ON cs.timeslot_id = ts.id
  WHERE e.student_id = ‼️PUT STUDENT ID HERE‼️
) AS sub
RIGHT JOIN timeslots ts ON CONCAT(TO_CHAR(ts.start_time, 'HH24:MI'), ' - ', TO_CHAR(ts.end_time, 'HH24:MI')) = sub.label
GROUP BY ts.start_time, ts.end_time
ORDER BY ts.start_time;
    `.trim()
              },
              {
                label: 'Timetable by Lecturer ID',
                bg: 'bg-blue-100',
                hover: 'hover:bg-blue-200',
                query: `
-- Enter lecturer ID below
SELECT
  CONCAT(TO_CHAR(ts.start_time, 'HH24:MI'), ' - ', TO_CHAR(ts.end_time, 'HH24:MI')) AS time_slot,
  MAX(CASE WHEN sub.weekday = 'Monday' THEN sched ELSE NULL END) AS Monday,
  MAX(CASE WHEN sub.weekday = 'Tuesday' THEN sched ELSE NULL END) AS Tuesday,
  MAX(CASE WHEN sub.weekday = 'Wednesday' THEN sched ELSE NULL END) AS Wednesday,
  MAX(CASE WHEN sub.weekday = 'Thursday' THEN sched ELSE NULL END) AS Thursday,
  MAX(CASE WHEN sub.weekday = 'Friday' THEN sched ELSE NULL END) AS Friday
FROM (
  SELECT
    cs.weekday,
    CONCAT(TO_CHAR(ts.start_time, 'HH24:MI'), ' - ', TO_CHAR(ts.end_time, 'HH24:MI')) AS label,
    'course: ' || c.id || ' - ' || c.course_name || ', room: ' || r.name AS sched
  FROM
    course_schedule cs
  JOIN courses c ON cs.course_id = c.id
  JOIN rooms r ON cs.room_id = r.id
  JOIN timeslots ts ON cs.timeslot_id = ts.id
  WHERE c.lecturer_id = ‼️PUT LECTURER ID HERE‼️
) AS sub
RIGHT JOIN timeslots ts ON CONCAT(TO_CHAR(ts.start_time, 'HH24:MI'), ' - ', TO_CHAR(ts.end_time, 'HH24:MI')) = sub.label
GROUP BY ts.start_time, ts.end_time
ORDER BY ts.start_time;
    `.trim()
              },
              {
                label: 'Timetable by Course ID',
                bg: 'bg-purple-100',
                hover: 'hover:bg-purple-200',
                query: `
-- Enter course ID below
SELECT
  CONCAT(TO_CHAR(ts.start_time, 'HH24:MI'), ' - ', TO_CHAR(ts.end_time, 'HH24:MI')) AS time_slot,
  MAX(CASE WHEN sub.weekday = 'Monday' THEN sched ELSE NULL END) AS Monday,
  MAX(CASE WHEN sub.weekday = 'Tuesday' THEN sched ELSE NULL END) AS Tuesday,
  MAX(CASE WHEN sub.weekday = 'Wednesday' THEN sched ELSE NULL END) AS Wednesday,
  MAX(CASE WHEN sub.weekday = 'Thursday' THEN sched ELSE NULL END) AS Thursday,
  MAX(CASE WHEN sub.weekday = 'Friday' THEN sched ELSE NULL END) AS Friday
FROM (
  SELECT
    cs.weekday,
    CONCAT(TO_CHAR(ts.start_time, 'HH24:MI'), ' - ', TO_CHAR(ts.end_time, 'HH24:MI')) AS label,
    'room: ' || r.name || ', participants: ' || (
      SELECT COUNT(*) FROM enrollments WHERE course_id = ‼️PUT COURSE ID HERE‼️
    ) AS sched
  FROM
    course_schedule cs
  JOIN rooms r ON cs.room_id = r.id
  JOIN timeslots ts ON cs.timeslot_id = ts.id
  LEFT JOIN enrollments e ON cs.course_id = e.course_id
  WHERE cs.course_id = ‼️PUT COURSE ID HERE‼️
) AS sub
RIGHT JOIN timeslots ts ON CONCAT(TO_CHAR(ts.start_time, 'HH24:MI'), ' - ', TO_CHAR(ts.end_time, 'HH24:MI')) = sub.label
GROUP BY ts.start_time, ts.end_time
ORDER BY ts.start_time;
    `.trim()
              },
              {
                label: 'Timetable by Room ID',
                bg: 'bg-yellow-100',
                hover: 'hover:bg-yellow-200',
                query: `
-- Enter room ID below
SELECT
  CONCAT(TO_CHAR(ts.start_time, 'HH24:MI'), ' - ', TO_CHAR(ts.end_time, 'HH24:MI')) AS time_slot,
  MAX(CASE WHEN sub.weekday = 'Monday' THEN sched ELSE NULL END) AS Monday,
  MAX(CASE WHEN sub.weekday = 'Tuesday' THEN sched ELSE NULL END) AS Tuesday,
  MAX(CASE WHEN sub.weekday = 'Wednesday' THEN sched ELSE NULL END) AS Wednesday,
  MAX(CASE WHEN sub.weekday = 'Thursday' THEN sched ELSE NULL END) AS Thursday,
  MAX(CASE WHEN sub.weekday = 'Friday' THEN sched ELSE NULL END) AS Friday
FROM (
  SELECT
    cs.weekday,
    CONCAT(TO_CHAR(ts.start_time, 'HH24:MI'), ' - ', TO_CHAR(ts.end_time, 'HH24:MI')) AS label,
    'course: ' || c.id || ' - ' || c.course_name AS sched
  FROM
    course_schedule cs
  JOIN courses c ON cs.course_id = c.id
  JOIN timeslots ts ON cs.timeslot_id = ts.id
  WHERE cs.room_id = ‼️PUT ROOM ID HERE‼️
) AS sub
RIGHT JOIN timeslots ts ON CONCAT(TO_CHAR(ts.start_time, 'HH24:MI'), ' - ', TO_CHAR(ts.end_time, 'HH24:MI')) = sub.label
GROUP BY ts.start_time, ts.end_time
ORDER BY ts.start_time;
                `.trim()
              }
            ].map((template, index) => (
              <button
                key={index}
                className={`${template.bg} text-gray-800 px-4 py-6 rounded shadow ${template.hover} transition text-sm text-center whitespace-normal break-words h-32 flex items-center justify-center`}
                onClick={() => setQuery((template.query || '-- SQL query for: ' + template.label).trim())}
              >
                {template.label}
              </button>
            ))}
          </div>
          <div className="h-4"></div>
        </div>
      </details>
      {/* --- Text area for manual SQL input --- */}
      <textarea
        className="w-full p-2 border border-gray-300 rounded resize-y min-h-[10rem]"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Enter SQL query here..."
        rows={Math.min(20, query.split('\n').length + 2)}
      />
      {/* --- Button to execute the SQL query --- */}
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={handleRunQuery}
      >
        Run Query
      </button>

      {/* --- Show error message if any --- */}
      {error && <pre className="text-red-500">{error}</pre>}
      {/* --- Show success message if no rows returned --- */}
      {successMessage && <pre className="text-green-600">{successMessage}</pre>}
      {/* --- Render results table if there is data --- */}
      {Array.isArray(result) && result.length > 0 && (
        <div className="overflow-x-auto mt-4">
          <div className="inline-block min-w-full max-w-5xl mx-auto">
            <table className="min-w-full bg-white border border-gray-300 text-sm">
            <thead>
              <tr>
                {/* Table headers based on the keys of the first result object */}
                {Object.keys(result[0]).map((key) => (
                  <th
                    key={key}
                    className="border border-gray-300 px-4 py-2 text-left bg-gray-100 font-medium"
                  >
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Render each row of results */}
              {result.map((row, i) => (
                <tr key={i} className="even:bg-gray-50">
                  {Object.values(row).map((value, j) => (
                    <td
                      key={j}
                      className="border border-gray-300 px-4 py-2 whitespace-nowrap"
                    >
                      {/* Truncate long strings; format ISO dates nicely; fallback to string */}
                      {typeof value === "string" && value.length > 100
                        ? `${value.slice(0, 100)}...`
                        : typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)
                          ? new Date(value).toLocaleDateString('de-DE', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })
                          : String(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}