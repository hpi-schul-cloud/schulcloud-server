import { EntityId } from '@shared/domain/types';
import { HelpdeskProblem } from '../do';

export interface HelpdeskProblemRepo {
	findById(id: EntityId): Promise<HelpdeskProblem>;
	findBySchoolId(schoolId: EntityId, options?: { limit?: number; skip?: number }): Promise<HelpdeskProblem[]>;
	save(problem: HelpdeskProblem): Promise<HelpdeskProblem>;
	delete(id: EntityId): Promise<void>;
}

export const HELPDESK_PROBLEM_REPO = 'HELPDESK_PROBLEM_REPO';
