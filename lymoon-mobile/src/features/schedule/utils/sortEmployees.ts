import type { Employee } from '@/types/schedule';

/**
 * Sort employees for display:
 *   1. Current user first
 *   2. Managers (alphabetical by name), supporting multiple managers
 *   3. Members (alphabetical by name)
 */
export function sortEmployees(employees: Employee[], currentUserId: string): Employee[] {
  return [...employees].sort((a, b) => {
    const aIsSelf = a.id === currentUserId;
    const bIsSelf = b.id === currentUserId;

    if (aIsSelf) return -1;
    if (bIsSelf) return 1;

    const aIsManager = a.role === 'Manager';
    const bIsManager = b.role === 'Manager';

    if (aIsManager && !bIsManager) return -1;
    if (!aIsManager && bIsManager) return 1;

    return a.name.localeCompare(b.name);
  });
}
