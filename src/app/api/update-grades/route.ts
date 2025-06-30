import { NextResponse } from 'next/server';

// Debug logs to confirm environment variables
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Service Role Key present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

// Handle POST request to update grades for enrollments
export async function POST(req: Request) {
  // Parse JSON body and get updates array
  const { updates } = await req.json();

  // Validate that updates is an array
  if (!Array.isArray(updates)) {
    return NextResponse.json({ error: 'Missing or invalid updates array' }, { status: 400 });
  }

  // Loop over each update object in the array
  for (const update of updates) {
    const { enrollment_id, grade } = update;
    console.log(`Processing update → enrollment_id: ${enrollment_id}, grade: ${grade}`);

    // Ensure enrollment_id is a valid number
    const parsedEnrollmentId = Number(enrollment_id);
    if (isNaN(parsedEnrollmentId) || parsedEnrollmentId < 1) {
      return NextResponse.json(
        { error: `Invalid enrollment_id value: ${enrollment_id}` },
        { status: 400 }
      );
    }

    // Validate grade (must be a number or null)
    if (grade !== null && (typeof grade !== 'number' || isNaN(grade))) {
      return NextResponse.json({ error: 'Invalid grade' }, { status: 400 });
    }

    // Update grade in Supabase using REST API call
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/enrollments?enrollment_id=eq.${parsedEnrollmentId}`, {
      method: 'PATCH',
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ grade }),
    });

    // Check for errors during the update request
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error updating grade:', errorText);
      return NextResponse.json({ error: 'Error updating grade' }, { status: 500 });
    }
  }

  // Return success response when all updates processed
  return new Response(null, { status: 200 });
}