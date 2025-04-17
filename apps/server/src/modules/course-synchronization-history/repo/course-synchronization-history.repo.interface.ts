import { CourseSynchronizationHistory } from '../domain';

export interface CourseSynchronizationHistoryRepo {
	saveAll(domainObjects: CourseSynchronizationHistory[]): Promise<CourseSynchronizationHistory[]>;

	findByExternalGroupId(externalGroupId: string): Promise<CourseSynchronizationHistory[]>;

	delete(domainObjects: CourseSynchronizationHistory[] | CourseSynchronizationHistory): Promise<void>;
}

export const COURSE_SYNCHRONIZATION_HISTORY_REPO = 'COURSE_SYNCHRONIZATION_HISTORY_REPO';
