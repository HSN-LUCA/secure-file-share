import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { getTicketById, addTicketResponse, getTicketResponses } from '@/lib/db/support-tickets';

/**
 * POST /api/support/tickets/:ticketId/responses - Add response to ticket
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { ticketId } = await params;

    const ticket = await getTicketById(ticketId);

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Check authorization
    if (ticket.user_id !== authResult.user.userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { message, attachments = [] } = body;

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    const response = await addTicketResponse(
      ticketId,
      authResult.user.userId,
      message,
      false,
      attachments
    );

    return NextResponse.json(
      {
        success: true,
        response,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding ticket response:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add response' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/support/tickets/:ticketId/responses - Get ticket responses
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { ticketId } = await params;

    const ticket = await getTicketById(ticketId);

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Check authorization
    if (ticket.user_id !== authResult.user.userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const responses = await getTicketResponses(ticketId);

    return NextResponse.json({
      success: true,
      responses,
    });
  } catch (error) {
    console.error('Error fetching ticket responses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch responses' },
      { status: 500 }
    );
  }
}
