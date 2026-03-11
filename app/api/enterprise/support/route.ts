/**
 * Enterprise Support API
 * Handles support ticket creation and management
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/jwt';
import { createSupportTicket, getUserSupportTickets } from '@/lib/db/queries';
import { validateInput } from '@/lib/validation/input-validation';
import { sendSupportEmail } from '@/lib/email/support';

/**
 * GET /api/enterprise/support
 * Get support tickets for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const ticketsResult = await getUserSupportTickets(user.userId);
    if (ticketsResult.error) {
      console.error('Failed to fetch support tickets:', ticketsResult.error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch support tickets' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        tickets: ticketsResult.data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Support GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/enterprise/support
 * Create a new support ticket
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, subject, message, priority } = body;
    const user = getUserFromRequest(request);

    // Validate required fields
    if (!email || !subject || !message) {
      return NextResponse.json(
        { success: false, error: 'email, subject, and message are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailValidation = validateInput(email, 'email');
    if (!emailValidation.valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate subject length
    if (typeof subject !== 'string' || subject.length < 5 || subject.length > 255) {
      return NextResponse.json(
        { success: false, error: 'Subject must be between 5 and 255 characters' },
        { status: 400 }
      );
    }

    // Validate message length
    if (typeof message !== 'string' || message.length < 10 || message.length > 5000) {
      return NextResponse.json(
        { success: false, error: 'Message must be between 10 and 5000 characters' },
        { status: 400 }
      );
    }

    // Validate priority if provided
    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    const ticketPriority = priority && validPriorities.includes(priority) ? priority : 'normal';

    // Create support ticket
    const ticketResult = await createSupportTicket({
      user_id: user?.userId || null,
      email,
      subject,
      message,
      priority: ticketPriority as 'low' | 'normal' | 'high' | 'urgent',
    });

    if (ticketResult.error) {
      console.error('Failed to create support ticket:', ticketResult.error);
      return NextResponse.json(
        { success: false, error: 'Failed to create support ticket' },
        { status: 500 }
      );
    }

    // Send confirmation email
    try {
      await sendSupportEmail({
        to: email,
        subject: `Support Ticket Created: ${ticketResult.data?.id}`,
        ticketId: ticketResult.data?.id || '',
        userMessage: message,
      });
    } catch (emailError) {
      console.error('Failed to send support email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json(
      {
        success: true,
        ticket: ticketResult.data,
        message: 'Support ticket created successfully. We will respond shortly.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Support POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
