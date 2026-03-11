import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware/api-auth';
import { getTicketById, addTicketResponse, getTicketResponses } from '@/lib/db/support-tickets';

/**
 * POST /api/support/tickets/:ticketId/responses - Add response to ticket
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const ticket = await getTicketById(params.ticketId);

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Check authorization
    if (ticket.user_id !== auth.userId && auth.role !== 'admin') {
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

    // Only admins can mark as internal
    const isInternal = auth.role === 'admin' && body.is_internal === true;

    const response = await addTicketResponse(
      params.ticketId,
      auth.userId,
      message,
      isInternal,
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
  { params }: { params: { ticketId: string } }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const ticket = await getTicketById(params.ticketId);

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Check authorization
    if (ticket.user_id !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const responses = await getTicketResponses(params.ticketId);

    // Filter out internal responses for non-admin users
    const filteredResponses = auth.role === 'admin'
      ? responses
      : responses.filter(r => !r.is_internal);

    return NextResponse.json({
      success: true,
      responses: filteredResponses,
    });
  } catch (error) {
    console.error('Error fetching ticket responses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch responses' },
      { status: 500 }
    );
  }
}
