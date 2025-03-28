import { CourseSynchronizationHistory } from '../do';

export interface CourseSynchronizationHistoryRepo {
	save(domainObject: CourseSynchronizationHistory): Promise<CourseSynchronizationHistory>;

	findByExternalGroupId(externalGroupId: string): Promise<CourseSynchronizationHistory | null>;
}

export const COURSE_SYNCHRONIZATION_HISTORY_REPO = 'COURSE_SYNCHRONIZATION_HISTORY_REPO';
