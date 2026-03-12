import { query as dbQuery } from './pool';

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  category: 'technical' | 'billing' | 'account' | 'general' | 'feature_request';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  attachments?: string[];
  tags?: string[];
}

export interface TicketResponse {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_internal: boolean;
  created_at: string;
  attachments?: string[];
}

/**
 * Create a new support ticket
 */
export async function createTicket(
  userId: string,
  subject: string,
  description: string,
  category: string,
  priority: string = 'medium',
  attachments: string[] = []
): Promise<SupportTicket> {
  const queryText = `
    INSERT INTO support_tickets (
      user_id, subject, description, category, priority, status, attachments, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
    RETURNING *
  `;

  const result = await dbQuery(queryText, [
    userId,
    subject,
    description,
    category,
    priority,
    'open',
    JSON.stringify(attachments),
  ]);

  return result.rows[0];
}

/**
 * Get ticket by ID
 */
export async function getTicketById(ticketId: string): Promise<SupportTicket | null> {
  const queryText = `
    SELECT * FROM support_tickets WHERE id = $1
  `;

  const result = await dbQuery(queryText, [ticketId]);
  return result.rows[0] || null;
}

/**
 * Get all tickets for a user
 */
export async function getUserTickets(
  userId: string,
  limit: number = 10,
  offset: number = 0
): Promise<{ tickets: SupportTicket[]; total: number }> {
  const queryText = `
    SELECT * FROM support_tickets 
    WHERE user_id = $1 
    ORDER BY created_at DESC 
    LIMIT $2 OFFSET $3
  `;

  const countQuery = `
    SELECT COUNT(*) as total FROM support_tickets WHERE user_id = $1
  `;

  const [ticketsResult, countResult] = await Promise.all([
    dbQuery(queryText, [userId, limit, offset]),
    dbQuery(countQuery, [userId]),
  ]);

  return {
    tickets: ticketsResult.rows,
    total: parseInt(countResult.rows[0].total),
  };
}

/**
 * Get all tickets (admin)
 */
export async function getAllTickets(
  status?: string,
  priority?: string,
  limit: number = 10,
  offset: number = 0
): Promise<{ tickets: SupportTicket[]; total: number }> {
  let queryText = 'SELECT * FROM support_tickets WHERE 1=1';
  const params: any[] = [];

  if (status) {
    queryText += ` AND status = $${params.length + 1}`;
    params.push(status);
  }

  if (priority) {
    queryText += ` AND priority = $${params.length + 1}`;
    params.push(priority);
  }

  queryText += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const countQuery = `
    SELECT COUNT(*) as total FROM support_tickets WHERE 1=1
    ${status ? `AND status = $1` : ''}
    ${priority ? `AND priority = $${status ? 2 : 1}` : ''}
  `;

  const countParams = [];
  if (status) countParams.push(status);
  if (priority) countParams.push(priority);

  const [ticketsResult, countResult] = await Promise.all([
    dbQuery(queryText, params),
    dbQuery(countQuery, countParams),
  ]);

  return {
    tickets: ticketsResult.rows,
    total: parseInt(countResult.rows[0].total),
  };
}

/**
 * Update ticket status
 */
export async function updateTicketStatus(
  ticketId: string,
  status: string,
  assignedTo?: string
): Promise<SupportTicket> {
  const queryText = `
    UPDATE support_tickets 
    SET status = $1, assigned_to = $2, updated_at = NOW()
    ${status === 'resolved' ? ', resolved_at = NOW()' : ''}
    WHERE id = $3
    RETURNING *
  `;

  const result = await dbQuery(queryText, [status, assignedTo || null, ticketId]);
  return result.rows[0];
}

/**
 * Add response to ticket
 */
export async function addTicketResponse(
  ticketId: string,
  userId: string,
  message: string,
  isInternal: boolean = false,
  attachments: string[] = []
): Promise<TicketResponse> {
  const queryText = `
    INSERT INTO ticket_responses (
      ticket_id, user_id, message, is_internal, attachments, created_at
    ) VALUES ($1, $2, $3, $4, $5, NOW())
    RETURNING *
  `;

  const result = await dbQuery(queryText, [
    ticketId,
    userId,
    message,
    isInternal,
    JSON.stringify(attachments),
  ]);

  // Update ticket updated_at
  await dbQuery('UPDATE support_tickets SET updated_at = NOW() WHERE id = $1', [ticketId]);

  return result.rows[0];
}

/**
 * Get ticket responses
 */
export async function getTicketResponses(ticketId: string): Promise<TicketResponse[]> {
  const queryText = `
    SELECT * FROM ticket_responses 
    WHERE ticket_id = $1 
    ORDER BY created_at ASC
  `;

  const result = await dbQuery(queryText, [ticketId]);
  return result.rows;
}

/**
 * Search tickets
 */
export async function searchTickets(
  searchQuery: string,
  userId?: string,
  limit: number = 10,
  offset: number = 0
): Promise<{ tickets: SupportTicket[]; total: number }> {
  const queryText = `
    SELECT * FROM support_tickets 
    WHERE (subject ILIKE $1 OR description ILIKE $1)
    ${userId ? 'AND user_id = $2' : ''}
    ORDER BY created_at DESC 
    LIMIT ${userId ? '$3' : '$2'} OFFSET ${userId ? '$4' : '$3'}
  `;

  const countQuery = `
    SELECT COUNT(*) as total FROM support_tickets 
    WHERE (subject ILIKE $1 OR description ILIKE $1)
    ${userId ? 'AND user_id = $2' : ''}
  `;

  const searchTerm = `%${searchQuery}%`;
  const params = userId ? [searchTerm, userId, limit, offset] : [searchTerm, limit, offset];
  const countParams = userId ? [searchTerm, userId] : [searchTerm];

  const [ticketsResult, countResult] = await Promise.all([
    dbQuery(queryText, params),
    dbQuery(countQuery, countParams),
  ]);

  return {
    tickets: ticketsResult.rows,
    total: parseInt(countResult.rows[0].total),
  };
}

/**
 * Get ticket statistics
 */
export async function getTicketStats(): Promise<{
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  average_resolution_time: number;
}> {
  const queryText = `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
      AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) as average_resolution_time
    FROM support_tickets
    WHERE resolved_at IS NOT NULL
  `;

  const result = await dbQuery(queryText);
  const row = result.rows[0];

  return {
    total: parseInt(row.total),
    open: parseInt(row.open) || 0,
    in_progress: parseInt(row.in_progress) || 0,
    resolved: parseInt(row.resolved) || 0,
    average_resolution_time: Math.round(row.average_resolution_time || 0),
  };
}

/**
 * Close ticket
 */
export async function closeTicket(ticketId: string): Promise<SupportTicket> {
  const queryText = `
    UPDATE support_tickets 
    SET status = 'closed', updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `;

  const result = await dbQuery(queryText, [ticketId]);
  return result.rows[0];
}
