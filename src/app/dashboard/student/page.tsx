'use client';

// Import React hooks and required libraries
import { useEffect, useState } from 'react';
import Select from 'react-select';
import { supabase } from '@/lib/supabaseClient';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  ReferenceLine,
  Bar
} from 'recharts';

export default function StudentDashboard() {
  // State variables for user, profile, courses, messages, and UI controls
  const [userUUID, setUserUUID] = useState<string | null>(null); // Not used, but can store user UUID if needed
  const [studentId, setStudentId] = useState<number | null>(null); // Current logged-in student's ID
  const [profile, setProfile] = useState<any>(null); // Student profile information
  const [timetable, setTimetable] = useState<any[]>([]); // Student's weekly timetable
  const [selectedCourses, setSelectedCourses] = useState<any[]>([]); // Courses student is enrolled in
  const [editing, setEditing] = useState(false); // Edit mode for profile
  const [editMode, setEditMode] = useState(false); // Unused, can be removed or used for future edit modes
  const [editPhone, setEditPhone] = useState(''); // Phone input for editing
  const [editAddress, setEditAddress] = useState(''); // Address input for editing
  // States for available and full courses (for enrollment)
  const [availableCourses, setAvailableCourses] = useState<any[]>([]); // Courses open to enroll
  const [fullCourses, setFullCourses] = useState<any[]>([]); // Courses at capacity
  const [allCoursesFetched, setAllCoursesFetched] = useState(false); // Status for courses data
  const [enrolling, setEnrolling] = useState<string | null>(null); // Course ID currently being enrolled
  // Messaging system state
  const [messages, setMessages] = useState<any[]>([]); // All messages (sent and received)
  const [showMessages, setShowMessages] = useState(false); // Controls message popup visibility
  const unreadCount = messages.filter((m) => m.receiver_role === 'student' && !m.is_read).length; // Unread inbox count
  const [showSent, setShowSent] = useState(false); // Toggle between inbox and sent messages
  // New message form state
  const [allRecipients, setAllRecipients] = useState<any[]>([]); // All possible recipients for new message
  const [selectedRecipient, setSelectedRecipient] = useState(''); // Selected recipient for new message
  // React-Select options for recipients
  const recipientOptions = allRecipients.map(r => ({
    value: `${r.type}-${r.id}`,
    label: `${capitalize(r.type)} ${r.id} – ${r.first_name} ${r.last_name}`,
  }));
  const [newMessageTitle, setNewMessageTitle] = useState(''); // New message title
  const [newMessageContent, setNewMessageContent] = useState(''); // New message content
  const [sendingMessage, setSendingMessage] = useState(false); // Sending state for new message
  const [messageSendSuccess, setMessageSendSuccess] = useState<string | null>(null); // Success feedback
  const [messageSendError, setMessageSendError] = useState<string | null>(null); // Error feedback
  // UI state for showing modals and course lists
  const [showNewMessage, setShowNewMessage] = useState(false); // Show/hide new message modal
  const [showAllAvailable, setShowAllAvailable] = useState(false); // Expand/collapse available courses list
  const [showAllFull, setShowAllFull] = useState(false); // Expand/collapse full courses list

  // Save edited profile (phone and address) to the backend
  const handleSave = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.id) {
      alert('No user logged in');
      return;
    }

    const response = await fetch('/api/update-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id, // korrigiert von user_id zu userId
        phone: editPhone,
        address: editAddress,
        role: 'student'
      }),
    });

    if (response.ok) {
      setProfile({ ...profile, phone: editPhone, address: editAddress });
      setEditing(false);
    } else {
      alert('Error updating profile');
    }
  };

  // Mark all unread messages as read for the student
  const markMessagesAsRead = async () => {
    if (!messages) return;
    const unreadIds = messages.filter((m: any) => !m.is_read).map((m: any) => m.id);
    if (unreadIds.length === 0) return;

    const { error: updateError } = await supabase
      .from('messages')
      .update({ is_read: true })
      .in('id', unreadIds);

    if (updateError) {
      console.error('Error updating read status:', updateError.message);
    } else {
      setMessages((prev) =>
        prev.map((m: any) =>
          unreadIds.includes(m.id) ? { ...m, is_read: true } : m
        )
      );
    }
  };

  // Main effect: fetch user, messages, profile, timetable, and courses on mount
  useEffect(() => {
    const getUserAndLoadData = async () => {
      // Get currently authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Extract student ID from user metadata
      const id = user?.user_metadata?.student_id;
      if (!id) return;
      setStudentId(id);

      // Load all messages (inbox and sent) for this student, sorted by newest first
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('id, title, content, is_read, created_at, sender_id, sender_role, receiver_id, receiver_role')
        .or(`receiver_id.eq.${id},sender_id.eq.${id}`)
        .order('created_at', { ascending: false });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError.message);
      } else {
        // For each message, resolve sender and receiver names for display
        const messagesWithNames = await Promise.all((messages || []).map(async (msg) => {
          // Resolve sender name
          let sender_first_name = 'Unknown';
          let sender_last_name = '';
          if (msg.sender_role === 'admin') {
            sender_first_name = 'Admin';
          } else {
            let table = msg.sender_role === 'lecturer' ? 'lecturers' : 'students';
            let { data: senderData, error: senderError } = await supabase
              .from(table)
              .select('first_name, last_name')
              .eq('id', msg.sender_id)
              .single();
            if (!senderError) {
              sender_first_name = senderData?.first_name || 'Unknown';
              sender_last_name = senderData?.last_name || '';
            }
          }
          // Resolve receiver name
          let receiver_first_name = 'Unknown';
          let receiver_last_name = '';
          if (msg.receiver_role === 'admin') {
            receiver_first_name = 'Admin';
          } else {
            let receiverTable = msg.receiver_role === 'lecturer' ? 'lecturers' : 'students';
            let { data: receiverData, error: receiverError } = await supabase
              .from(receiverTable)
              .select('first_name, last_name')
              .eq('id', msg.receiver_id)
              .single();
            if (receiverError) {
              console.error(`Error fetching receiver (${receiverTable}) info:`, receiverError.message);
              receiver_first_name = 'Unknown';
              receiver_last_name = '';
            } else {
              receiver_first_name = receiverData?.first_name || 'Unknown';
              receiver_last_name = receiverData?.last_name || '';
            }
          }
          return {
            ...msg,
            sender_first_name,
            sender_last_name,
            receiver_first_name,
            receiver_last_name,
          };
        }));
        setMessages(messagesWithNames);
      }

      // Fetch all possible recipients for the new message form (students, lecturers, admin)
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, first_name, last_name');
      const { data: lecturersData } = await supabase
        .from('lecturers')
        .select('id, first_name, last_name');
      // Admin is a special recipient
      const adminOption = {
        type: 'admin',
        id: 1, // assuming admin id is 1
        first_name: 'Admin',
        last_name: '',
      };
      const all = [];
      if (studentsData) {
        for (const s of studentsData) {
          all.push({
            type: 'student',
            id: s.id,
            first_name: s.first_name,
            last_name: s.last_name,
          });
        }
      }
      if (lecturersData) {
        for (const l of lecturersData) {
          all.push({
            type: 'lecturer',
            id: l.id,
            first_name: l.first_name,
            last_name: l.last_name,
          });
        }
      }
      all.push(adminOption);
      // Sort recipients: students, then lecturers, then admin, each by ID
      const rolePriority: Record<string, number> = {
        student: 1,
        lecturer: 2,
        admin: 3
      };
      all.sort((a, b) => {
        const roleDiff = rolePriority[a.type] - rolePriority[b.type];
        if (roleDiff !== 0) return roleDiff;
        return a.id - b.id;
      });
      setAllRecipients(all);

      // Fetch student profile data
      const { data: student } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single();
      setProfile(student);
      setEditPhone(student?.phone || '');
      setEditAddress(student?.address || '');

      // Fetch timetable for student (calls a stored procedure)
      const { data: schedule, error: scheduleError } = await supabase.rpc('get_student_schedule', {
        student_id_input: id,
      });
      setTimetable(schedule || []);
      if (scheduleError) console.error('Schedule fetch error:', scheduleError);

      // Fetch all enrollments for this student (to get selected courses)
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`
          course_id,
          grade,
          enrollment_date,
          courses (
            course_name,
            ects,
            language,
            lecturers!courses_lecturer_id_fkey (
              first_name,
              last_name
            )
          )
        `)
        .eq('student_id', id);
      // Map the enrollments to course display objects
      const courses = (enrollments ?? []).map((e: any) => ({
        course_id: e.course_id,
        course_name: e.courses?.course_name,
        ects: e.courses?.ects,
        language: e.courses?.language,
        lecturer_name: e.courses?.lecturers
          ? `${e.courses.lecturers.first_name} ${e.courses.lecturers.last_name}`
          : '–',
        grade: e.grade,
        enrollment_date: e.enrollment_date
      }));
      setSelectedCourses(courses);

      // Fetch all courses (for display in available and full lists)
      const { data: allCourses, error: allCoursesError } = await supabase
        .from('courses')
        .select(`
          id,
          course_name,
          ects,
          language,
          max_participants,
          lecturers!courses_lecturer_id_fkey (
            first_name,
            last_name
          )
        `);
      if (allCoursesError) {
        setAvailableCourses([]);
        setFullCourses([]);
        setAllCoursesFetched(true);
        return;
      }

      // Fetch all enrollments (for all students) to determine course capacities
      const { data: allEnrollments } = await supabase
        .from('enrollments')
        .select('course_id, student_id');
      // Count enrollments per course
      const enrollmentCounts: Record<string, number> = {};
      (allEnrollments || []).forEach((e: any) => {
        enrollmentCounts[e.course_id] = (enrollmentCounts[e.course_id] || 0) + 1;
      });
      // Build a set of course IDs the student is already enrolled in
      const selectedCourseIds = new Set((enrollments ?? []).map((e: any) => e.course_id));
      // Organize courses into available (not full) and full (at capacity), excluding already enrolled
      const available: any[] = [];
      const full: any[] = [];
      (allCourses || []).forEach((course: any) => {
        // Skip courses already enrolled in
        if (selectedCourseIds.has(course.id)) return;
        const enrolled = enrollmentCounts[course.id] || 0;
        const unlimited = course.max_participants == null;
        const hasCapacity = unlimited || enrolled < course.max_participants;
        const courseObj = {
          ...course,
          lecturer_name: course.lecturers
            ? `${course.lecturers.first_name} ${course.lecturers.last_name}`
            : '–',
          enrolledCount: enrolled,
        };
        if (hasCapacity) {
          available.push(courseObj);
        } else {
          full.push(courseObj);
        }
      });
      setAvailableCourses(available);
      setFullCourses(full);
      setAllCoursesFetched(true);
    };
    // Run the data loading function on initial mount
    getUserAndLoadData();
  }, []);

  // Weekdays for timetable columns
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  // Timeslots for timetable rows
  const timeslots = [
    { id: 1, start_time: '08:15:00', end_time: '10:00:00' },
    { id: 2, start_time: '10:15:00', end_time: '12:00:00' },
    { id: 3, start_time: '12:15:00', end_time: '14:00:00' },
    { id: 4, start_time: '14:15:00', end_time: '16:00:00' },
    { id: 5, start_time: '16:15:00', end_time: '18:00:00' },
    { id: 6, start_time: '18:15:00', end_time: '20:00:00' },
    { id: 7, start_time: '20:15:00', end_time: '22:00:00' },
  ];
  // Helper to get the courses for a cell in timetable (by day and time)
  const getCoursesForCell = (day: string, time: string) => {
    const courses = timetable.filter(
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

  // ECTS calculation for insights (total, min, max)
  const ectsEarned = selectedCourses.reduce((sum, c) => sum + (c.ects || 0), 0);
  const maxECTS = 32;
  const minECTS = 16;

  // GPA and percentile calculation for insights
  const gradedCourses = selectedCourses.filter(c => typeof c.grade === 'number');
  const totalECTS = gradedCourses.reduce((sum, c) => sum + (c.ects || 0), 0);
  const gpa = totalECTS > 0
    ? gradedCourses.reduce((sum, c) => sum + (c.grade * c.ects), 0) / totalECTS
    : 0;
  // Placeholder for percentile (can be replaced with actual data logic)
  const percentile = 82; // e.g. 82% better than others

  // Handler for enrolling in a course
  const handleEnroll = async (course_id: string) => {
    if (!studentId) return;
    setEnrolling(course_id);
    try {
      const res = await fetch('/api/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id, student_id: studentId }),
      });
      if (res.ok) {
        // Reload to update courses after successful enrollment
        location.reload();
      } else {
        alert('Error enrolling in course');
      }
    } catch (e) {
      alert('Error enrolling in course');
    }
    setEnrolling(null);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Dashboard Header */}
      <h1 className="mt-12 text-4xl font-bold mb-10 text-center">🎓 Student Dashboard – Welcome {profile?.first_name} {profile?.last_name}</h1>

      {/* Profile and Messages Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Profile Card */}
        <div className="bg-gray-100 p-4 rounded-md shadow">
          <h2 className="text-lg font-semibold mb-2">👤 Your Profile</h2>
          <p><strong>Email:</strong> {profile?.email}</p>
          <p>
            <strong>Phone:</strong>{' '}
            {editing ? (
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
            {editing ? (
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
              ? new Date(profile.birthday).toLocaleDateString('en-GB') // optionales Format
              : '—'}
          </p>
          {/* Edit mode for profile */}
          {editing ? (
            <div className="text-right mt-2 flex gap-2 justify-end">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditPhone(profile?.phone || '');
                  setEditAddress(profile?.address || '');
                  setEditing(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="text-right mt-4">
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>
        {/* Messages Card */}
        <div className="bg-gray-100 p-4 rounded-md shadow">
          <h2 className="text-lg font-semibold mb-4">📬 Your Messages</h2>
          <div className="flex flex-col gap-2 mb-4">
            {/* Inbox Button */}
            <button
              onClick={() => {
                setShowMessages(true);
                setShowSent(false);
              }}
              className="relative w-52 mx-auto px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              📥 Inbox
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-yellow-300 text-black text-xs px-2 py-0.5 rounded-full z-10">
                  {unreadCount}
                </span>
              )}
            </button>
            {/* Sent Messages Button */}
            <button
              onClick={() => {
                setShowMessages(true);
                setShowSent(true);
              }}
              className="w-52 mx-auto px-4 py-2 rounded bg-gray-400 text-white hover:bg-gray-500"
            >
              📤 Sent
            </button>
            {/* New Message Button */}
            <button
              onClick={() => {
                setShowNewMessage(true);
                setShowMessages(false);
                setShowSent(false);
              }}
              className="w-52 mx-auto px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
            >
              ✏️ New Message
            </button>
          </div>
          {/* New message form moved to modal */}
        </div>
      {/* New Message Popup Modal */}
      {/* Modal for composing a new message */}
      {showNewMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
            <button
              className="absolute top-4 right-4 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              onClick={() => setShowNewMessage(false)}
              aria-label="Close"
              type="button"
            >
              Close
            </button>
            <h3 className="font-semibold mb-2 flex items-center gap-2">✏️ New Message</h3>
            {messageSendError && (
              <div className="mb-2 text-red-700 bg-red-100 px-2 py-1 rounded">{messageSendError}</div>
            )}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setMessageSendSuccess(null);
                setMessageSendError(null);
                if (!selectedRecipient || !newMessageTitle || !newMessageContent) {
                  setMessageSendError('Please fill out all fields.');
                  return;
                }
                // Parse role and id from selectedRecipient (e.g., "lecturer-2")
                const match = selectedRecipient.match(/^(\w+)-(\d+)$/);
                if (!match) {
                  setMessageSendError('Invalid recipient selected.');
                  return;
                }
                const receiver_role = match[1];
                const receiver_id = parseInt(match[2], 10);
                setSendingMessage(true);
                // Get sender info
                const {
                  data: { user },
                } = await supabase.auth.getUser();
                const sender_id = studentId;
                const sender_role = 'student';
                try {
                  const { error } = await supabase.from('messages').insert([{
                    title: newMessageTitle,
                    content: newMessageContent,
                    sender_id,
                    sender_role,
                    receiver_id,
                    receiver_role,
                    is_read: false,
                    created_at: new Date().toISOString()
                  }]);
                  if (error) {
                    setMessageSendError('Failed to send message.');
                  } else {
                    setMessageSendSuccess('✅ Message sent successfully!');
                    setSelectedRecipient('');
                    setNewMessageTitle('');
                    setNewMessageContent('');
                    // Optionally reload messages
                  }
                } catch (err) {
                  setMessageSendError('Failed to send message.');
                }
                setSendingMessage(false);
              }}
            >
              <div className="mb-2">
                <Select
                  options={recipientOptions}
                  value={recipientOptions.find(option => option.value === selectedRecipient) || null}
                  onChange={(option) => {
                    if (option) {
                      setSelectedRecipient(option.value);
                    } else {
                      setSelectedRecipient('');
                    }
                  }}
                  placeholder="Select recipient..."
                  isClearable
                />
              </div>
              <div className="mb-2">
                <input
                  className="border p-2 w-full rounded"
                  type="text"
                  value={newMessageTitle}
                  onChange={e => setNewMessageTitle(e.target.value)}
                  required
                  placeholder="Title"
                />
              </div>
              <div className="mb-2">
                <textarea
                  className="border p-2 w-full rounded"
                  rows={4}
                  value={newMessageContent}
                  onChange={e => setNewMessageContent(e.target.value)}
                  required
                  placeholder="Message content"
                />
              </div>
              <div className="mt-4">
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  disabled={sendingMessage}
                >
                  {sendingMessage ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
            {messageSendSuccess && (
              <>
                <div className="mt-4 text-green-700 bg-green-100 px-2 py-2 rounded text-center font-semibold">
                  {messageSendSuccess}
                </div>
                <button
                  onClick={() => location.reload()}
                  className="mt-3 w-full px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Close & Reload
                </button>
              </>
            )}
          </div>
        </div>
      )}
      </div>

      {/* Timetable Section */}
      <h2 className="text-xl font-semibold mt-16 mb-2">📅 Your Timetable</h2>
      <div className="overflow-x-auto">
        <table className="table-auto w-full border border-black">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-black p-2 text-left w-32">Time</th>
              {weekdays.map((day) => (
                <th key={day} className="border border-black p-2 text-left w-1/5">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeslots.map((slot) => {
              const timeLabel = `${slot.start_time.slice(0, 5)} – ${slot.end_time.slice(0, 5)}`;
              return (
                <tr key={slot.id}>
                  <td className="border border-black p-2 align-top">
                    {slot.start_time.slice(0, 5)}<br />{slot.end_time.slice(0, 5)}
                  </td>
                  {weekdays.map((day) => (
                    <td key={day} className="border border-black p-2 align-top">
                      {getCoursesForCell(day, timeLabel)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Courses Table Section */}
      <h2 className="text-xl font-semibold mt-16 mb-2">📚 Your Courses</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded border">
          <thead className="bg-blue-100">
            <tr>
              <th className="text-left p-2">Course Name</th>
              <th className="text-left p-2">Course ID</th>
              <th className="text-left p-2">Lecturer</th>
              <th className="text-left p-2">Language</th>
              <th className="text-left p-2">ECTS</th>
              <th className="text-left p-2">Grade</th>
              <th className="text-left p-2">Enrollment Date</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {selectedCourses.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-4 text-center text-gray-500">No courses found.</td>
              </tr>
            ) : (
              selectedCourses.map((course, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-2">{course.course_name}</td>
                  <td className="p-2">{course.course_id}</td>
                  <td className="p-2">{course.lecturer_name}</td>
                  <td className="p-2">{course.language}</td>
                  <td className="p-2">{course.ects}</td>
                  <td className="p-2">{course.grade != null ? course.grade : 'Not published yet'}</td>
                  <td className="p-2">{course.enrollment_date}</td>
                  <td className="p-2">
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to disenroll from this course?')) {
                          fetch('/api/disenroll', {
                            method: 'DELETE',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ course_id: course.course_id, student_id: studentId }),
                          })
                          .then((res) => {
                            if (res.ok) {
                              location.reload();
                            } else {
                              alert('Error while disenrolling');
                            }
                          });
                        }
                      }}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Disenroll
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Insights Section: ECTS, Language, Grades, GPA */}
      <h2 className="text-xl font-semibold mt-16 mb-2">📊 Insights: Selected Courses</h2>
      <div className="grid grid-cols-4 gap-4">
        {/* Doughnut Chart: ECTS Progress */}
        <div className="h-96 bg-white shadow rounded p-4 flex flex-col items-center justify-between">
          <div className="w-full h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'ECTS Earned', value: ectsEarned },
                    { name: 'Remaining', value: maxECTS - ectsEarned }
                  ]}
                  innerRadius={70}
                  outerRadius={100}
                  dataKey="value"
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                >
                  <Cell fill={ectsEarned >= minECTS ? '#22c55e' : '#ef4444'} />
                  <Cell fill="#e5e7eb" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
              <p className="text-xl font-bold">{ectsEarned} ECTS</p>
            </div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-xs text-gray-700 font-semibold bg-white/80 px-1 rounded">
              Min 16
            </div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 text-xs text-gray-700 font-semibold bg-white/80 px-1 rounded">
              Max 32
            </div>
          </div>
          <div className="text-sm text-center">
            {ectsEarned < minECTS ? (
              <p className="text-red-600 font-semibold">
                ❗️ You need to take at least {minECTS - ectsEarned} more ECTS this semester.
              </p>
            ) : ectsEarned < maxECTS ? (
              <p className="text-green-600 font-semibold">
                ✅ You have enough ECTS for this semester. You can take up to {maxECTS - ectsEarned} more.
              </p>
            ) : (
              <p className="text-green-700 font-semibold">
                ✅ You have reached the maximum amount of ECTS for this semester.
              </p>
            )}
          </div>
        </div>

        {/* Language Chart: ECTS in English and German */}
        <div className="h-96 bg-white shadow rounded p-4 flex flex-col justify-between">
          <div className="w-full">
            <p className="text-center font-semibold mb-4">Language Requirements</p>
            {[{ lang: 'English', key: 'english' }, { lang: 'German', key: 'german' }].map(({ lang, key }) => {
              const total = selectedCourses
                .filter(c => c.language?.toLowerCase() === key)
                .reduce((sum, c) => sum + (c.ects || 0), 0);
              const color = total >= 6 ? '#22c55e' : '#ef4444';
              return (
                <div key={key} className="mb-4">
                  <div className="flex justify-between text-sm font-medium mb-1">
                    <span>{lang}</span><span>{total} ECTS</span>
                  </div>
                  <div className="relative h-4 bg-gray-200 rounded overflow-hidden">
                    <div style={{ width: `${(total / 32) * 100}%`, backgroundColor: color }} className="h-full"></div>
                    <div className="absolute left-[18.75%] top-0 h-full border-l-2 border-black opacity-50" />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-sm text-center">
            {(() => {
              const eng = selectedCourses.filter(c => c.language?.toLowerCase() === 'english').reduce((sum, c) => sum + (c.ects || 0), 0);
              const ger = selectedCourses.filter(c => c.language?.toLowerCase() === 'german').reduce((sum, c) => sum + (c.ects || 0), 0);
              const engMissing = Math.max(0, 6 - eng);
              const gerMissing = Math.max(0, 6 - ger);
              if (engMissing > 0 && gerMissing > 0) {
                return <p className="text-red-600 font-semibold">❗️ You need {gerMissing} more ECTS in German and {engMissing} more in English this semester.</p>;
              } else if (engMissing > 0) {
                return <p className="text-red-600 font-semibold">❗️ You need {engMissing} more ECTS in English this semester.</p>;
              } else if (gerMissing > 0) {
                return <p className="text-red-600 font-semibold">❗️ You need {gerMissing} more ECTS in German this semester.</p>;
              } else {
                return <p className="text-green-600 font-semibold">✅ You fulfill the language requirements for this semester.</p>;
              }
            })()}
          </div>
        </div>

        {/* Grades Overview Bar Chart */}
        <div className="h-96 bg-white shadow rounded p-4 flex flex-col justify-between">
          <p className="text-center font-semibold mb-4">Grades Overview</p>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={selectedCourses.filter(c => c.grade != null).map(c => ({
                course_id: c.course_id,
                grade: c.grade
              }))}
              margin={{ top: 10, right: 20, left: 20, bottom: 30 }}
            >
              <XAxis dataKey="course_id" />
              <YAxis domain={[1, 6]} ticks={[1, 2, 3, 4, 5, 6]} />
              <ReferenceLine y={4} stroke="black" strokeDasharray="3 3" label={{ value: "Pass", position: "insideTopRight", offset: 5 }} />
              <Bar dataKey="grade">
                {selectedCourses.filter(c => c.grade != null).map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.grade >= 4 ? "#22c55e" : "#ef4444"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* GPA Box */}
        <div className={`h-96 shadow rounded p-4 flex flex-col items-center justify-center text-center ${gpa >= 4 ? 'bg-green-100' : 'bg-red-100'}`}>
          <div>
            <p className="text-xl font-semibold mb-2">GPA:</p>
            {gradedCourses.length === 0 ? (
              <>
                <p className="text-4xl font-bold">N/A</p>
                <p className="text-sm mt-4 text-gray-700">No grades published yet.</p>
              </>
            ) : (
              <>
                <p className="text-4xl font-bold">{gpa.toFixed(2)}</p>
                <p className="text-sm mt-4 text-gray-700">
                  {gpa >= 4
                    ? '✅ With this current GPA, you will pass the semester.'
                    : '❌ With this current GPA, you will not pass the semester.'}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
      {/* Available Courses to Enroll Section */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold mt-16 mb-2">🟢 Courses Available to Enroll</h2>
        <div className="overflow-x-auto mb-8">
          <table className="min-w-full bg-white shadow-md rounded border">
            <thead className="bg-green-100">
              <tr>
                <th className="text-left p-2">Course Name</th>
                <th className="text-left p-2">Course ID</th>
                <th className="text-left p-2">Lecturer</th>
                <th className="text-left p-2">Language</th>
                <th className="text-left p-2">ECTS</th>
                <th className="text-left p-2">Capacity</th>
                <th className="text-left p-2">Enrolled</th>
                <th className="text-left p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {!allCoursesFetched ? (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-gray-500">Loading...</td>
                </tr>
              ) : availableCourses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-gray-500">No available courses to enroll.</td>
                </tr>
              ) : (
                (showAllAvailable ? availableCourses : availableCourses.slice(0, 5)).map((course, idx) => (
                  <tr key={course.id} className="border-t">
                    <td className="p-2">{course.course_name}</td>
                    <td className="p-2">{course.id}</td>
                    <td className="p-2">{course.lecturer_name}</td>
                    <td className="p-2">{course.language}</td>
                    <td className="p-2">{course.ects}</td>
                    <td className="p-2">{course.max_participants == null ? 'Unlimited' : course.max_participants}</td>
                    <td className="p-2">{course.enrolledCount}</td>
                    <td className="p-2">
                      <button
                        className={`px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 ${enrolling === course.id ? 'opacity-50' : ''}`}
                        disabled={enrolling === course.id}
                        onClick={() => handleEnroll(course.id)}
                      >
                        {enrolling === course.id ? 'Enrolling...' : 'Enroll'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {availableCourses.length > 5 && (
          <div className="text-center mt-2">
            {!showAllAvailable ? (
              <button
                className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => setShowAllAvailable(true)}
              >
                Show All
              </button>
            ) : (
              <button
                className="px-4 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                onClick={() => setShowAllAvailable(false)}
              >
                Collapse
              </button>
            )}
          </div>
        )}
        {/* Full Courses Section */}
        <h2 className="text-xl font-semibold mt-16 mb-2">🚫 Full Courses (No Capacity)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded border">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-2">Course Name</th>
                <th className="text-left p-2">Course ID</th>
                <th className="text-left p-2">Lecturer</th>
                <th className="text-left p-2">Language</th>
                <th className="text-left p-2">ECTS</th>
                <th className="text-left p-2">Capacity</th>
                <th className="text-left p-2">Enrolled</th>
                <th className="text-left p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {!allCoursesFetched ? (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-gray-500">Loading...</td>
                </tr>
              ) : fullCourses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-gray-500">No full courses.</td>
                </tr>
              ) : (
                (showAllFull ? fullCourses : fullCourses.slice(0, 5)).map((course, idx) => (
                  <tr key={course.id} className="border-t">
                    <td className="p-2">{course.course_name}</td>
                    <td className="p-2">{course.id}</td>
                    <td className="p-2">{course.lecturer_name}</td>
                    <td className="p-2">{course.language}</td>
                    <td className="p-2">{course.ects}</td>
                    <td className="p-2">{course.max_participants == null ? 'Unlimited' : course.max_participants}</td>
                    <td className="p-2">{course.enrolledCount}</td>
                    <td className="p-2">
                      <button
                        className="px-3 py-1 rounded bg-gray-400 text-white cursor-not-allowed"
                        disabled
                        tabIndex={-1}
                      >Enroll</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {fullCourses.length > 5 && (
            <div className="text-center mt-2">
              {!showAllFull ? (
                <button
                  className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={() => setShowAllFull(true)}
                >
                  Show All
                </button>
              ) : (
                <button
                  className="px-4 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                  onClick={() => setShowAllFull(false)}
                >
                  Collapse
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Message Popup (Inbox or Sent) */}
      {showMessages && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {showSent ? '📤 Sent' : '📬 Inbox'}
              </h2>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  onClick={() => {
                    markMessagesAsRead();
                    setShowMessages(false);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
            <ul className="space-y-4">
              {(showSent ? messages.filter(msg => msg.sender_role === 'student') : messages.filter(msg => msg.receiver_role === 'student')).map((msg) => (
                <li
                  key={msg.id}
                  className={`border p-4 rounded bg-gray-50 ${!msg.is_read && !showSent ? 'border-l-4 border-blue-400' : ''}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{msg.title}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(msg.created_at).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    {showSent ? (
                      <>To: {msg.receiver_role === 'admin' ? 'Admin' : `${msg.receiver_first_name || 'Unknown'} ${msg.receiver_last_name || ''}`}</>
                    ) : (
                      <>From: {msg.sender_role === 'admin' ? 'Admin' : `${msg.sender_first_name || 'Unknown'} ${msg.sender_last_name || ''}`}</>
                    )}
                  </div>
                  <p className="mt-2 text-gray-700">{msg.content}</p>
                  {!msg.is_read && !showSent && (
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
    </div>
  );
}
// Helper function to capitalize a string (for recipient labels)
function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}