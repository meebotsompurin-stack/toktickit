import { TicketStatus, Role } from '@prisma/client';

export interface TransitionRule {
  target: TicketStatus;
  roles: Role[];
}

export const STATUS_TRANSITIONS: Record<TicketStatus, TransitionRule[]> = {
  NEW: [
    { target: 'OPEN', roles: ['IT_STAFF', 'ADMINISTRATOR'] },
    { target: 'CANCELLED', roles: ['REQUESTER', 'IT_STAFF', 'ADMINISTRATOR'] },
  ],
  OPEN: [
    { target: 'IN_PROGRESS', roles: ['IT_STAFF', 'ADMINISTRATOR'] },
    { target: 'WAITING_FOR_REQUESTER', roles: ['IT_STAFF', 'ADMINISTRATOR'] },
    { target: 'CANCELLED', roles: ['IT_STAFF', 'ADMINISTRATOR'] },
  ],
  IN_PROGRESS: [
    { target: 'WAITING_FOR_REQUESTER', roles: ['IT_STAFF', 'ADMINISTRATOR'] },
    { target: 'RESOLVED', roles: ['IT_STAFF', 'ADMINISTRATOR'] },
    { target: 'OPEN', roles: ['IT_STAFF', 'ADMINISTRATOR'] },
    { target: 'CANCELLED', roles: ['IT_STAFF', 'ADMINISTRATOR'] },
  ],
  WAITING_FOR_REQUESTER: [
    { target: 'IN_PROGRESS', roles: ['REQUESTER', 'IT_STAFF', 'ADMINISTRATOR'] },
    { target: 'RESOLVED', roles: ['IT_STAFF', 'ADMINISTRATOR'] },
    { target: 'CANCELLED', roles: ['IT_STAFF', 'ADMINISTRATOR'] },
  ],
  RESOLVED: [
    { target: 'CLOSED', roles: ['REQUESTER', 'IT_STAFF', 'ADMINISTRATOR'] },
    { target: 'REOPENED', roles: ['REQUESTER', 'IT_STAFF', 'ADMINISTRATOR'] },
  ],
  CLOSED: [
    { target: 'REOPENED', roles: ['IT_STAFF', 'ADMINISTRATOR'] },
  ],
  REOPENED: [
    { target: 'IN_PROGRESS', roles: ['IT_STAFF', 'ADMINISTRATOR'] },
    { target: 'WAITING_FOR_REQUESTER', roles: ['IT_STAFF', 'ADMINISTRATOR'] },
    { target: 'CANCELLED', roles: ['IT_STAFF', 'ADMINISTRATOR'] },
  ],
  CANCELLED: [],
};

/**
 * Checks whether transitioning from currentStatus to targetStatus is permitted for the given role.
 */
export function isValidTransition(
  currentStatus: string,
  targetStatus: string,
  role: string
): boolean {
  if (currentStatus === targetStatus) {
    return true;
  }

  const rules = STATUS_TRANSITIONS[currentStatus as TicketStatus];
  if (!rules) {
    return false;
  }

  const rule = rules.find((r) => r.target === targetStatus);
  if (!rule) {
    return false;
  }

  return rule.roles.includes(role as Role);
}

/**
 * Returns the list of permitted next statuses from currentStatus for a given role.
 */
export function getPermittedTransitions(currentStatus: string, role: string): string[] {
  const rules = STATUS_TRANSITIONS[currentStatus as TicketStatus] || [];
  return rules
    .filter((r) => r.roles.includes(role as Role))
    .map((r) => r.target);
}
