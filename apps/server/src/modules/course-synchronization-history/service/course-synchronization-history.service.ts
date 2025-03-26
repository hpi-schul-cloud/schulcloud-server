import { CourseSynchronizationHistoryRepo, COURSE_SYNCHRONIZATION_HISTORY_REPO } from '../repo';
import { Inject } from '@nestjs/common';
import { CourseSynchronizationHistory, CourseSynchronizationHistorySaveProps } from '../do';

export class CourseSynchronizationHistoryService {
	constructor(
		@Inject(COURSE_SYNCHRONIZATION_HISTORY_REPO)
		private readonly courseSynchronizationHistoryRepo: CourseSynchronizationHistoryRepo
	) {}

	public async save(saveProps: CourseSynchronizationHistorySaveProps): Promise<CourseSynchronizationHistory> {
		// TODO: config for expiration
		const history: CourseSynchronizationHistory = new CourseSynchronizationHistory({
			...saveProps,
			expirationDate: new Date(Date.now() + 5 * 60 * 60 * 1000),
		});

		const saveResult: CourseSynchronizationHistory = await this.courseSynchronizationHistoryRepo.save(history);

		return saveResult;
	}

	public async findByExternalGroupId(externalGroupId: string): Promise<CourseSynchronizationHistory | null> {
		const foundHistory: CourseSynchronizationHistory | null =
			await this.courseSynchronizationHistoryRepo.findByExternalGroupId(externalGroupId);

		return foundHistory;
	}
}
