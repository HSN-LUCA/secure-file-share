import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware/api-auth';
import {
  createTicket,
  getUserTickets,
  getAllTickets,
  searchTickets,
} from '@/lib/db/support-tickets';

/**
 * POST /api/support/tickets - Create a new support ticket
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.context) {
      return auth.response || NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subject, description, category, priority = 'medium', attachments = [] } = body;

    // Validate required fields
    if (!subject || !description || !category) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          details: 'subject, description, and category are required',
        },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['technical', 'billing', 'account', 'general', 'feature_request'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid category',
          details: `Category must be one of: ${validCategories.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid priority',
          details: `Priority must be one of: ${validPriorities.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const ticket = await createTicket(
      auth.context.userId,
      subject,
      description,
      category,
      priority,
      attachments
    );

    return NextResponse.json(
      {
        success: true,
        ticket: {
          id: ticket.id,
          subject: ticket.subject,
          status: ticket.status,
          priority: ticket.priority,
          created_at: ticket.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating support ticket:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create ticket' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/support/tickets - Get user's tickets or search
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.context) {
      return auth.response || NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = (page - 1) * limit;
    const searchQuery = searchParams.get('search');

    let result;

    if (searchQuery) {
      result = await searchTickets(searchQuery, auth.context.userId, limit, offset);
    } else {
      result = await getUserTickets(auth.context.userId, limit, offset);
    }

    return NextResponse.json({
      success: true,
      tickets: result.tickets,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}
