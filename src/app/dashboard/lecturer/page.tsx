'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from 'recharts';
import Select from 'react-select';


export default function LecturerDashboard() {
  const [userUUID, setUserUUID] = useState<string | null>(null);
  const [lecturerId, setLecturerId] = useState<number | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [timetable, setTimetable] = useState<any[]>([]);

  // State for messaging features
  const [messages, setMessages] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showMessages, setShowMessages] = useState(false);
  const [showSent, setShowSent] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);
  // State for new message modal
  const [allRecipients, setAllRecipients] = useState<any[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<any | null>(null);
  const [newMessageTitle, setNewMessageTitle] = useState('');
  const [newMessageContent, setNewMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageSendSuccess, setMessageSendSuccess] = useState(false);
  const [messageSendError, setMessageSendError] = useState('');
  // State for sending message to an entire course
  const [showCourseMessage, setShowCourseMessage] = useState(false);
  const [selectedCourseForMessage, setSelectedCourseForMessage] = useState<any | null>(null);
  const [courseMessageTitle, setCourseMessageTitle] = useState('');
  const [courseMessageContent, setCourseMessageContent] = useState('');
  const [sendingCourseMessage, setSendingCourseMessage] = useState(false);
  const [courseMessageSuccess, setCourseMessageSuccess] = useState(false);
  const [courseMessageError, setCourseMessageError] = useState('');
  // Helper function to capitalize the first letter of a string
  function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Format options for recipient dropdown in new message modal
  const recipientOptions = allRecipients.map(r => ({
    value: `${r.role}-${r.id}`,
    label: `${capitalize(r.role)} ${r.id} – ${r.first_name} ${r.last_name}`,
  }));

  const [editMode, setEditMode] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');

  // State for grade assignment dialog and handlers
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [gradeInputs, setGradeInputs] = useState<{ [studentId: number]: string }>({});
  const [showGradeDialog, setShowGradeDialog] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Opens the grade assignment dialog and loads students for the selected course
  const openGradeDialog = async (course: any) => {
    setSelectedCourse(course);
    setShowGradeDialog(true);
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('enrollment_id, student_id, grade, fk_student (first_name, last_name)')
      .eq('course_id', course.course_id);
    setEnrolledStudents(enrollments || []);
    const initialGrades: { [studentId: number]: string } = {};
    (enrollments || []).forEach((e: any) => {
      initialGrades[e.student_id] = e.grade ?? '';
    });
    setGradeInputs(initialGrades);
  };

  // Save grades for students in the selected course
  const saveGrades = async () => {
    if (!selectedCourse) return;

    const updates = enrolledStudents.map((e) => ({
      enrollment_id: e.enrollment_id,
      grade: gradeInputs[e.student_id] === '' ? null : parseFloat(gradeInputs[e.student_id]),
    }));

    try {
      const response = await fetch('/api/update-grades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
      });

      if (response.ok) {
        // Try to read JSON response if available
        let result = null;
        try {
          result = await response.json();
        } catch (jsonError) {
          // Ignore if no JSON returned
        }

        setSaveSuccess(true);
      } else {
        let errorMessage = 'Failed to update grades';
        try {
          const errorResult = await response.json();
          if (errorResult?.error) errorMessage = errorResult.error;
        } catch (e) {
          // Ignore if error message is not readable
        }
        alert(errorMessage);
      }
    } catch (e) {
      // Log unexpected errors during grade saving
      console.error('Unexpected error during grade saving:', e);
      alert('Unexpected error saving grades');
    }
  };

  // Save profile edits for phone and address
  const handleSave = async () => {
    if (!lecturerId) return;

    const response = await fetch('/api/update-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userUUID,
        phone: editPhone,
        address: editAddress,
        role: 'lecturer'
      }),
    });

    const result = await response.json();

    if (response.ok) {
      setProfile({ ...profile, phone: editPhone, address: editAddress });
      setEditMode(false);
    } else {
      alert(result.error || 'Error updating profile');
    }
  };

  // Load user, profile, timetable, messages, and recipients on mount
  useEffect(() => {
    const getUserAndLoadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const id = user?.user_metadata?.lecturer_id;
      const uuid = user?.id;
      if (uuid) setUserUUID(uuid);

      if (!id) return;

      setLecturerId(id);

      const { data: lecturer } = await supabase
        .from('lecturers')
        .select('*')
        .eq('id', id)
        .single();

      console.log('Lecturer ID used for schedule fetch:', id);
      const { data: schedule, error: scheduleError } = await supabase.rpc('get_lecturer_schedule', {
        lecturer_id_input: id,
      });
      console.log('Schedule data:', schedule);
      if (scheduleError) console.error('Schedule fetch error:', scheduleError);

      setProfile(lecturer);
      setEditPhone(lecturer?.phone || '');
      setEditAddress(lecturer?.address || '');
      setTimetable(schedule || []);
      // Load messages for this lecturer (inbox and sent)
      if (id) {
        const fetchMessages = async () => {
          const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(
              `and(sender_id.eq.${id},sender_role.eq.lecturer),and(receiver_id.eq.${id},receiver_role.eq.lecturer)`
            )
            .order('created_at', { ascending: false });

          // Add sender and receiver names to each message
          if (data) {
            const enrichedMessages = await Promise.all(
              data.map(async (msg) => {
                let sender_first_name = 'Unknown';
                let sender_last_name = '';
                if (msg.sender_role === 'admin') {
                  sender_first_name = 'Admin';
                } else {
                  const senderTable = msg.sender_role === 'student' ? 'students' : 'lecturers';
                  const { data: senderData } = await supabase
                    .from(senderTable)
                    .select('first_name, last_name')
                    .eq('id', msg.sender_id)
                    .single();
                  sender_first_name = senderData?.first_name || 'Unknown';
                  sender_last_name = senderData?.last_name || '';
                }

                let receiver_first_name = 'Unknown';
                let receiver_last_name = '';
                if (msg.receiver_role === 'admin') {
                  receiver_first_name = 'Admin';
                } else {
                  const receiverTable = msg.receiver_role === 'student' ? 'students' : 'lecturers';
                  const { data: receiverData } = await supabase
                    .from(receiverTable)
                    .select('first_name, last_name')
                    .eq('id', msg.receiver_id)
                    .single();
                  receiver_first_name = receiverData?.first_name || 'Unknown';
                  receiver_last_name = receiverData?.last_name || '';
                }

                return {
                  ...msg,
                  sender_first_name,
                  sender_last_name,
                  receiver_first_name,
                  receiver_last_name,
                };
              })
            );

            setMessages(enrichedMessages);
            const unread = enrichedMessages.filter(m => m.receiver_id === id && m.receiver_role === 'lecturer' && !m.is_read);
            setUnreadCount(unread.length);
          }
        };

        fetchMessages();
      }
      // Load all possible recipients for new message modal
      const loadRecipients = async () => {
        const { data: students } = await supabase.from('students').select('id, first_name, last_name');
        const { data: lecturers } = await supabase.from('lecturers').select('id, first_name, last_name');
        const recipients = [
          ...(students || []).map((s) => ({ id: s.id, role: 'student', first_name: s.first_name, last_name: s.last_name })),
          ...(lecturers || []).map((l) => ({ id: l.id, role: 'lecturer', first_name: l.first_name, last_name: l.last_name })),
          { id: 'admin', role: 'admin', first_name: 'Admin', last_name: '' },
        ];
        setAllRecipients(recipients);
      };
      loadRecipients();
    };

    getUserAndLoadData();
  }, []);

  // List of weekdays for timetable display
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // Timetable timeslots for each day
  const timeslots = [
    { id: 1, start_time: '08:15:00', end_time: '10:00:00', label: 'Slot 1' },
    { id: 2, start_time: '10:15:00', end_time: '12:00:00', label: 'Slot 2' },
    { id: 3, start_time: '12:15:00', end_time: '14:00:00', label: 'Slot 3' },
    { id: 4, start_time: '14:15:00', end_time: '16:00:00', label: 'Slot 4' },
    { id: 5, start_time: '16:15:00', end_time: '18:00:00', label: 'Slot 5' },
    { id: 6, start_time: '18:15:00', end_time: '20:00:00', label: 'Slot 6' },
    { id: 7, start_time: '20:15:00', end_time: '22:00:00', label: 'Slot 7' },
  ];

  // Returns courses scheduled for a specific cell (day and time) in timetable
  const getCoursesForCell = (day: string, time: string) => {
    const courses = timetable
      .filter(
        (item) =>
          item.weekday === day &&
          `${item.start_time.slice(0, 5)} – ${item.end_time.slice(0, 5)}` === time
      );

    if (courses.length === 0) {
      return <span className="text-gray-400">–</span>;
    }

    return courses.map((item) => (
      <div key={item.course_id} className="mb-1">
        <strong>{item.course_id} – {item.course_name}</strong><br />
        Room: {item.room_name}
      </div>
    ));
  };

  // Main dashboard UI rendering
  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Spacer */}
      <div className="mb-4"></div>
      <h1 className="mt-12 text-4xl font-bold mb-10 text-center">👩‍🏫 Lecturer Dashboard – Welcome {profile?.first_name} {profile?.last_name}</h1>

      {/* Profile and messaging panel */}
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        {/* Profile section */}
        <div className="w-full md:w-1/2">
          <div className="bg-gray-100 p-4 rounded-md shadow">
            <h2 className="text-lg font-semibold mb-2">👤 Your Profile</h2>
            <p><strong>Email:</strong> {profile?.email}</p>
            <p>
              <strong>Phone:</strong>{' '}
              {editMode ? (
                <input
                  className="border p-1 ml-2"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                />
              ) : (
                profile?.phone
              )}
            </p>
            <p>
              <strong>Address:</strong>{' '}
              {editMode ? (
                <input
                  className="border p-1 ml-2"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                />
              ) : (
                profile?.address
              )}
            </p>
            <p>
              <strong>Birthday:</strong>{' '}
              {profile?.birthday
                ? new Date(profile.birthday).toLocaleDateString('en-GB')
                : '—'}
            </p>
            {editMode ? (
              <div className="text-right mt-2 flex gap-2 justify-end">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditMode(false);
                    setEditPhone(profile?.phone || '');
                    setEditAddress(profile?.address || '');
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="text-right mt-4">
                <button
                  onClick={() => setEditMode(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Messaging shortcuts section */}
        <div className="w-full md:w-1/2">
          <div className="bg-gray-100 p-4 rounded-md shadow">
            <h2 className="text-lg font-semibold mb-4">📬 Your Messages</h2>
            <div className="grid grid-cols-2 gap-2 w-full max-w-xs mx-auto">
              <button
                onClick={() => setShowMessages(true)}
                className="relative bg-blue-600 text-white rounded py-2 px-4 hover:bg-blue-700 w-full"
              >
                📥 Inbox
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-yellow-300 text-black text-xs px-2 py-0.5 rounded-full z-10">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  setShowSent(true);
                  setShowMessages(true);
                }}
                className="bg-gray-400 text-white rounded py-2 px-4 hover:bg-gray-500 w-full"
              >
                📤 Sent
              </button>
              <button
                onClick={() => setShowNewMessage(true)}
                className="bg-green-600 text-white rounded py-2 px-4 hover:bg-green-700 w-full"
              >
                ✏️ New Message
              </button>
              <button
                onClick={() => setShowCourseMessage(true)}
                className="bg-green-600 text-white rounded py-2 px-4 hover:bg-green-700 w-full"
              >
                🏫 New Message to Course
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Timetable section */}
      <h2 className="text-xl font-semibold mt-16 mb-4">📅 Your Timetable</h2>
      <div className="overflow-x-auto">
        <table className="table-auto w-full border border-black">
          <thead>
            <tr className="bg-gray-200">
              <th className="border-black border p-2 text-left w-32">Time</th>
              {weekdays.map((day) => (
                <th key={day} className="border-black border p-2 text-left w-1/5">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeslots.map((slot) => {
              const displayTime = `${slot.start_time.slice(0, 5)} – ${slot.end_time.slice(0, 5)}`;
              return (
                <tr key={slot.id}>
                  <td className="border border-black p-2 align-top">
                    {slot.start_time.slice(0, 5)}<br />{slot.end_time.slice(0, 5)}
                  </td>
                  {weekdays.map((day) => (
                    <td key={day} className="border border-black p-2 align-top">
                      {getCoursesForCell(day, displayTime)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Course overview section */}
      <h2 className="text-xl font-semibold mt-16 mb-4">📚 Your Courses</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded border">
          <thead className="bg-blue-100">
            <tr>
              <th className="text-left p-2">Course Name</th>
              <th className="text-left p-2">Course ID</th>
              <th className="text-left p-2">Students Enrolled</th>
              <th className="text-left p-2">Max Participants</th>
              <th className="text-left p-2">Language</th>
              <th className="text-left p-2">ECTS</th>
              <th className="text-left p-2">Format</th>
              {/* Assign Grades button column */}
              <th className="text-left p-2">Assign Grades</th>
            </tr>
          </thead>
          <tbody>
            {timetable.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-4 text-center text-gray-500">No courses found.</td>
              </tr>
            ) : (
              Array.from(new Map(timetable.map(course => [course.course_id, course])).values()).map((course, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-2">{course.course_name}</td>
                  <td className="p-2">{course.course_id}</td>
                  <td className="p-2">{course.enrolled_count}</td>
                  <td className="p-2">{course.max_participants === null ? 'No limit' : course.max_participants}</td>
                  <td className="p-2">{course.language}</td>
                  <td className="p-2">{course.ects}</td>
                  <td className="p-2">{course.format}</td>
                  {/* Assign Grades button */}
                  <td className="p-2 text-center">
                    <button
                      className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                      onClick={() => openGradeDialog(course)}
                    >
                      Grade
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Course Insights Section */}
      <h2 className="text-xl font-semibold mt-16 mb-4">📊 Course Insights</h2>
      <div className="grid grid-cols-4 gap-4">
        {/* Chart 1: Enrollment per Course */}
        <div className="bg-white shadow rounded p-4">
          <h3 className="text-lg font-semibold mb-2">Enrollment per Course</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              layout="horizontal"
              data={Array.from(new Map(timetable.map(course => [course.course_id, course])).values()).map((course) => {
                const max = course.max_participants;
                const enrolled = course.enrolled_count;
                return {
                  name: course.course_id.toString(),
                  enrolled,
                  remaining: max !== null ? Math.max(0, max - enrolled) : 0,
                  max: max ?? '∞'
                };
              })}
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <XAxis type="category" dataKey="name" />
              <YAxis type="number" domain={[0, 'dataMax']} tick={{ fontSize: 12 }} />
              <Tooltip />

              {/* Enrolled students (blue) */}
              <Bar
                dataKey="enrolled"
                stackId="a"
                fill="#3b82f6"
              />

              {/* Remaining capacity (gray) */}
              <Bar
                dataKey="remaining"
                stackId="a"
                fill="#e5e7eb"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 bg-blue-500 rounded"></span>
              <span>Enrolled Students</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 bg-gray-300 rounded"></span>
              <span>Available Slots</span>
            </div>
          </div>
        </div>

        {/* Chart 2: Enrollment Trends Over Time */}
        <div className="bg-white shadow rounded p-4">
          <h3 className="text-lg font-semibold mb-2">Enrollment Trends Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={
                (() => {
                  const courseMap = new Map();
                  timetable.forEach(course => {
                    if (!Array.isArray(course.enrollments)) return;
                    course.enrollments.forEach((e: any) => {
                      if (!e.enrollment_date) return;
                      const date = new Date(e.enrollment_date).toISOString().split('T')[0];
                      if (!courseMap.has(course.course_id)) {
                        courseMap.set(course.course_id, {});
                      }
                      const courseDates = courseMap.get(course.course_id);
                      courseDates[date] = (courseDates[date] || 0) + 1;
                    });
                  });

                  const allDates = Array.from(
                    new Set(
                      Array.from(courseMap.values()).flatMap(dates => Object.keys(dates))
                    )
                  ).sort((a, b) => a.localeCompare(b));

                  const cumulativeData = allDates.map(date => {
                    const entry: any = { date };
                    timetable.forEach(course => {
                      const id = course.course_id;
                      if (!courseMap.has(id)) return;
                      const courseDates = courseMap.get(id);
                      if (!entry[id]) entry[id] = 0;
                    });

                    return entry;
                  });

                  const cumulativeSums: Record<string, number> = {};
                  cumulativeData.forEach(row => {
                    Object.keys(row).forEach(key => {
                      if (key === 'date') return;
                      cumulativeSums[key] = (cumulativeSums[key] || 0) + (courseMap.get(Number(key))?.[row.date] || 0);
                      row[key] = cumulativeSums[key];
                    });
                  });

                  return cumulativeData;
                })()
              }
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis
                dataKey="date"
                ticks={
                  (() => {
                    const allDates = Array.from(
                      new Set(
                timetable.flatMap(course =>
                  Array.isArray(course.enrollments)
                    ? course.enrollments.map((e: { enrollment_date: string }) => e.enrollment_date?.split('T')[0])
                    : []
                )
                      )
                    )
                      .filter(Boolean)
                      .sort();

                    const total = allDates.length;
                    if (total <= 3) return allDates;
                    return [allDates[0], allDates[Math.floor(total / 2)], allDates[total - 1]];
                  })()
                }
                tickFormatter={(date) => {
                  const d = new Date(date);
                  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}`;
                }}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              {Array.from(new Set(timetable.map(c => c.course_id))).map((id) => (
                <Line
                  key={id}
                  type="monotone"
                  dataKey={id.toString()}
                  stroke={`hsl(${id * 97 % 360}, 65%, 45%)`}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 3: Grading Progress */}
        <div className="bg-white shadow rounded p-4">
          <h3 className="text-lg font-semibold mb-2">Grading Progress by Course</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={
                Array.from(new Map(timetable.map(course => [course.course_id, course])).values()).map((course) => {
                  const enrollments = Array.isArray(course.enrollments) ? course.enrollments : [];
                  const graded = enrollments.filter((e: { grade: number | null }) => e.grade !== null).length;
                  const total = enrollments.length;
                  const remaining = total - graded;
                  return {
                    name: course.course_id.toString(),
                    graded,
                    remaining,
                  };
                })
              }
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="graded" stackId="a" fill="#22c55e" />
              <Bar dataKey="remaining" stackId="a" fill="#e5e7eb" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 bg-green-500 rounded"></span>
              <span>Graded</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 bg-gray-300 rounded"></span>
              <span>Pending Grades</span>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded p-4">
          <h3 className="text-lg font-semibold mb-2">Grade Distribution Heatmap</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              layout="vertical"
              data={
                Array.from(new Map(timetable.map(course => [course.course_id, course])).values()).map(course => {
                  const enrollments = Array.isArray(course.enrollments) ? course.enrollments : [];
                  const bins = { 1: 0, 1.25: 0, 1.5: 0, 1.75: 0, 2: 0, 2.25: 0, 2.5: 0, 2.75: 0, 3: 0, 3.25: 0, 3.5: 0, 3.75: 0, 4: 0, 4.25: 0, 4.5: 0, 4.75: 0, 5: 0, 5.25: 0, 5.5: 0, 5.75: 0, 6: 0 };
                  enrollments.forEach((e: { grade: number | null }) => {
                    if (e.grade !== null && bins.hasOwnProperty(e.grade)) {
                      bins[e.grade as keyof typeof bins]++;
                    }
                  });
                  return {
                    courseId: course.course_id,
                    ...bins
                  };
                })
              }
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="courseId" />
              <Tooltip />
              {[
                1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4,
                4.25, 4.5, 4.75, 5, 5.25, 5.5, 5.75, 6
              ].map((grade, idx) => (
                <Bar
                  key={grade}
                  dataKey={grade.toString()}
                  stackId="a"
                  fill={`hsl(${(grade - 1) * 50}, 70%, 60%)`}
                  isAnimationActive={false}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
          <p className="text-sm text-gray-500 mt-2">Each bar represents the distribution of grades (1–6) per course.</p>
        </div>
      </div>
      {/* Grade Assignment Dialog */}
      {showGradeDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Assign Grades – {selectedCourse?.course_name}</h3>
            <table className="w-full mb-4">
              <thead>
                <tr>
                  <th className="text-left p-2">Student</th>
                  <th className="text-left p-2">Grade</th>
                </tr>
              </thead>
              <tbody>
                {enrolledStudents.map((e: any) => (
                  <tr key={e.student_id}>
                    <td className="p-2">
                      {e.fk_student?.first_name} {e.fk_student?.last_name}
                    </td>
                    <td className="p-2">
                      <select
                        className="border rounded px-2 py-1 w-24"
                        value={gradeInputs[e.student_id] ?? ''}
                        onChange={(ev) =>
                          setGradeInputs((prev) => ({
                            ...prev,
                            [e.student_id]: ev.target.value,
                          }))
                        }
                      >
                        <option value="">—</option>
                        {[...Array(21)].map((_, i) => {
                          const grade = (1 + i * 0.25).toFixed(2);
                          return (
                            <option key={grade} value={grade}>
                              {grade}
                            </option>
                          );
                        })}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex flex-col items-end gap-2">
              {!saveSuccess ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowGradeDialog(false)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveGrades}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Save Grades
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-end gap-2">
                  <p className="text-green-600 font-semibold">✅ Grades saved successfully</p>
                  <button
                    onClick={() => {
                      setShowGradeDialog(false);
                      setSelectedCourse(null);
                      window.location.reload();
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Close &amp; Reload
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Inbox & Sent Messages Popups */}
      {showMessages && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={async () => {
                if (!showSent && messages.length > 0) {
                  const unreadIds = messages
                    .filter((m: any) => m.receiver_id === lecturerId && m.receiver_role === 'lecturer' && !m.is_read)
                    .map((m: any) => m.id);

                  if (unreadIds.length > 0) {
                    await supabase
                      .from('messages')
                      .update({ is_read: true })
                      .in('id', unreadIds);

                    setMessages(messages.map((m) =>
                      unreadIds.includes(m.id) ? { ...m, is_read: true } : m
                    ));

                    setUnreadCount(0);
                  }
                }

                setShowMessages(false);
                setShowSent(false);
              }}
              className="absolute top-4 right-4 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              aria-label="Close"
              type="button"
            >
              Close
            </button>
            <h3 className="text-lg font-semibold mb-4">
              {showSent ? '📤 Sent' : '📥 Inbox'}
            </h3>
            <ul className="space-y-4">
              {messages
                .filter((m) =>
                  showSent
                    ? m.sender_id === lecturerId && m.sender_role === 'lecturer'
                    : m.receiver_id === lecturerId && m.receiver_role === 'lecturer'
                )
                .map((m) => (
                  <li
                    key={m.id}
                    className={`border p-4 rounded bg-gray-50 ${!m.is_read && !showSent ? 'border-l-4 border-blue-400' : ''}`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{m.title}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(m.created_at).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      {showSent ? (
                        <>To: {m.receiver_role === 'admin' ? 'Admin' : `${m.receiver_first_name || 'Unknown'} ${m.receiver_last_name || ''}`}</>
                      ) : (
                        <>From: {m.sender_role === 'admin' ? 'Admin' : `${m.sender_first_name || 'Unknown'} ${m.sender_last_name || ''}`}</>
                      )}
                    </div>
                    <p className="mt-2 text-gray-700">{m.content}</p>
                    {!m.is_read && !showSent && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        New
                      </span>
                    )}
                  </li>
                ))}
            </ul>
          </div>
        </div>
      )}
      {/* New Message Modal */}
      {showNewMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => {
                setShowNewMessage(false);
                setSelectedRecipient(null);
                setNewMessageTitle('');
                setNewMessageContent('');
                setMessageSendSuccess(false);
                setMessageSendError('');
              }}
              className="absolute top-4 right-4 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Close
            </button>
            <h3 className="text-lg font-semibold mb-4">✏️ New Message</h3>
            <Select
              options={recipientOptions}
              value={
                recipientOptions.find(
                  option => option.value === (selectedRecipient ? `${selectedRecipient.role}-${selectedRecipient.id}` : '')
                ) || null
              }
              onChange={(option) => {
                if (option) {
                  const [role, id] = option.value.split('-');
                  const recipient = allRecipients.find(r => r.role === role && String(r.id) === id);
                  setSelectedRecipient(recipient || null);
                } else {
                  setSelectedRecipient(null);
                }
              }}
              placeholder="Select recipient..."
              isClearable
            />
            <input
              type="text"
              placeholder="Title"
              value={newMessageTitle}
              onChange={(e) => setNewMessageTitle(e.target.value)}
              className="w-full border p-2 mb-2 rounded mt-2"
            />
            <textarea
              placeholder="Message content"
              value={newMessageContent}
              onChange={(e) => setNewMessageContent(e.target.value)}
              className="w-full border p-2 mb-2 rounded"
              rows={4}
            />
            <button
              onClick={async () => {
                if (!selectedRecipient || !newMessageTitle || !newMessageContent) {
                  setMessageSendError('Please fill all fields and select a recipient.');
                  return;
                }
                setSendingMessage(true);
                const { error } = await supabase.from('messages').insert({
                  sender_id: lecturerId,
                  sender_role: 'lecturer',
                  receiver_id: selectedRecipient.id === 'admin' ? null : selectedRecipient.id,
                  receiver_role: selectedRecipient.role,
                  title: newMessageTitle,
                  content: newMessageContent,
                  is_read: false,
                  created_at: new Date().toISOString(),
                });
                setSendingMessage(false);
                if (error) {
                  setMessageSendError(error.message);
                } else {
                  setMessageSendSuccess(true);
                }
              }}
              className="w-full bg-green-600 text-white rounded py-2 px-4 hover:bg-green-700 mt-2"
              disabled={sendingMessage}
            >
              {sendingMessage ? 'Sending...' : 'Send'}
            </button>
            {messageSendError && <p className="text-red-500 mt-2">{messageSendError}</p>}
            {messageSendSuccess && (
              <div className="mt-2">
                <p className="text-green-600 font-semibold">✅ Message sent successfully</p>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-blue-600 text-white rounded py-2 px-4 hover:bg-blue-700 mt-2"
                >
                  Close & Reload
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* New Message to Course Modal */}
      {showCourseMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => {
                setShowCourseMessage(false);
                setSelectedCourseForMessage(null);
                setCourseMessageTitle('');
                setCourseMessageContent('');
                setCourseMessageSuccess(false);
                setCourseMessageError('');
              }}
              className="absolute top-4 right-4 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Close
            </button>
            <h3 className="text-lg font-semibold mb-4">✉️ New Message to Course</h3>
            {/* Deduplicate courses for dropdown using Map */}
            {(() => {
              const uniqueCourses = Array.from(new Map(timetable.map(c => [c.course_id, c])).values());
              return (
                <Select
                  options={uniqueCourses.map(c => ({
                    value: c.course_id,
                    label: `${c.course_id} – ${c.course_name}`
                  }))}
                  value={selectedCourseForMessage
                    ? { value: selectedCourseForMessage.course_id, label: `${selectedCourseForMessage.course_id} – ${selectedCourseForMessage.course_name}` }
                    : null}
                  onChange={(option) => {
                    const course = uniqueCourses.find(c => c.course_id === option?.value);
                    setSelectedCourseForMessage(course || null);
                  }}
                  placeholder="Select course..."
                  isClearable
                />
              );
            })()}
            <input
              type="text"
              placeholder="Title"
              value={courseMessageTitle}
              onChange={(e) => setCourseMessageTitle(e.target.value)}
              className="w-full border p-2 mb-2 rounded mt-2"
            />
            <textarea
              placeholder="Message content"
              value={courseMessageContent}
              onChange={(e) => setCourseMessageContent(e.target.value)}
              className="w-full border p-2 mb-2 rounded"
              rows={4}
            />
            <button
              onClick={async () => {
                if (!selectedCourseForMessage || !courseMessageTitle || !courseMessageContent) {
                  setCourseMessageError('Please fill all fields and select a course.');
                  return;
                }
                setSendingCourseMessage(true);
                const { data: enrolled } = await supabase
                  .from('enrollments')
                  .select('student_id')
                  .eq('course_id', selectedCourseForMessage.course_id);

                if (!enrolled || enrolled.length === 0) {
                  setCourseMessageError('No students enrolled in this course.');
                  setSendingCourseMessage(false);
                  return;
                }

                const messagesToInsert = enrolled.map(e => ({
                  sender_id: lecturerId,
                  sender_role: 'lecturer',
                  receiver_id: e.student_id,
                  receiver_role: 'student',
                  title: courseMessageTitle,
                  content: courseMessageContent,
                  is_read: false,
                  created_at: new Date().toISOString(),
                }));

                const { error } = await supabase.from('messages').insert(messagesToInsert);
                setSendingCourseMessage(false);
                if (error) {
                  setCourseMessageError(error.message);
                } else {
                  setCourseMessageSuccess(true);
                }
              }}
              className="w-full bg-green-600 text-white rounded py-2 px-4 hover:bg-green-700 mt-2"
              disabled={sendingCourseMessage}
            >
              {sendingCourseMessage ? 'Sending...' : 'Send'}
            </button>
            {courseMessageError && <p className="text-red-500 mt-2">{courseMessageError}</p>}
            {courseMessageSuccess && (
              <div className="mt-2">
                <p className="text-green-600 font-semibold">✅ Messages sent successfully</p>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-blue-600 text-white rounded py-2 px-4 hover:bg-blue-700 mt-2"
                >
                  Close & Reload
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}