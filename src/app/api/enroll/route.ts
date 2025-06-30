import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role key for secure server-side access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Handle POST request to enroll a student in a course
export async function POST(req: Request) {
  try {
    // Parse JSON body to get student_id and course_id
    const { student_id, course_id } = await req.json();
    console.log('ENROLL REQUEST:', { student_id, course_id });

    // Check if required parameters are present
    if (!student_id || !course_id) {
      return NextResponse.json({ error: 'Missing student_id or course_id' }, { status: 400 });
    }

    // Insert a new enrollment record with a fixed enrollment date
    const { error } = await supabase
      .from('enrollments')
      .insert([{ student_id, course_id, enrollment_date: '2025-02-16' }]);

    // Handle insertion errors
    if (error) {
      console.error('Error inserting enrollment:', error);
      return NextResponse.json({ error: 'Failed to enroll student' }, { status: 500 });
    }

    // Return success response if no errors
    return NextResponse.json({ success: true });
  } catch (err) {
    // Handle unexpected server errors
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
