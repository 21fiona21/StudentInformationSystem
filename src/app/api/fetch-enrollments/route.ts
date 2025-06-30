import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role key for server-side access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Handle POST request to fetch enrollments for a given course
export async function POST(req: Request) {
  try {
    // Parse JSON body to get courseId
    const { courseId } = await req.json();
    console.log('Incoming courseId:', courseId);

    // Validate if courseId is provided
    if (!courseId) {
      return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });
    }

    // Query enrollments with related student names
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        enrollment_id,
        student_id,
        grade,
        students (
          first_name,
          last_name
        )
      `)
      .eq('course_id', courseId);

    // Handle possible query error
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Fetched enrollments:', data);
    // Return fetched enrollment data
    return NextResponse.json({ enrollments: data });
  } catch (err) {
    // Handle unexpected errors
    console.error(err);
    return NextResponse.json({ error: (err as Error).message || 'Internal Server Error' }, { status: 500 });
  }
}