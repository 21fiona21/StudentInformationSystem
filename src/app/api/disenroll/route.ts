import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Handle DELETE request to disenroll a student from a course
export async function DELETE(req: Request) {
  try {
    // Parse JSON body to get course_id and student_id
    const { course_id, student_id } = await req.json();

    // Validate presence of required parameters
    if (!course_id || !student_id) {
      return NextResponse.json({ error: 'Missing course_id or student_id' }, { status: 400 });
    }

    // Perform deletion in the enrollments table
    const { error } = await supabase
      .from('enrollments')
      .delete()
      .match({ course_id, student_id });

    // Handle possible error during deletion
    if (error) {
      console.error('Supabase deletion error:', error.message);
      return NextResponse.json({ error: 'Failed to disenroll student' }, { status: 500 });
    }

    // Return success response
    return NextResponse.json({ message: 'Successfully disenrolled student' }, { status: 200 });
  } catch (error: any) {
    // Catch unexpected errors
    console.error('Unhandled error:', error.message);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}