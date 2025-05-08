import { ObjectId } from '@mikro-orm/mongodb';
import { CourseSynchronizationHistory, CourseSynchronizationHistoryProps } from './course-synchronization-history';

export type CourseSynchronizationHistoryBuildParams = Omit<CourseSynchronizationHistoryProps, 'id'>;

export class CourseSynchronizationHistoryFactory {
	public static build(params: CourseSynchronizationHistoryBuildParams): CourseSynchronizationHistory {
		const syncHistory: CourseSynchronizationHistory = new CourseSynchronizationHistory({
			...params,
			id: new ObjectId().toHexString(),
		});

		return syncHistory;
	}
}
