import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware/api-auth';
import {
  getTicketById,
  updateTicketStatus,
  getTicketResponses,
  closeTicket,
} from '@/lib/db/support-tickets';

/**
 * GET /api/support/tickets/:ticketId - Get ticket details
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

    return NextResponse.json({
      success: true,
      ticket,
      responses,
    });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/support/tickets/:ticketId - Update ticket status (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status, assigned_to } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      );
    }

    const validStatuses = ['open', 'in_progress', 'waiting_user', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid status',
          details: `Status must be one of: ${validStatuses.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const ticket = await updateTicketStatus(params.ticketId, status, assigned_to);

    return NextResponse.json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update ticket' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/support/tickets/:ticketId - Close ticket
 */
export async function DELETE(
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

    const closedTicket = await closeTicket(params.ticketId);

    return NextResponse.json({
      success: true,
      ticket: closedTicket,
    });
  } catch (error) {
    console.error('Error closing ticket:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to close ticket' },
      { status: 500 }
    );
  }
}
