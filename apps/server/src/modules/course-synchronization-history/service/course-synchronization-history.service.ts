import { Inject } from '@nestjs/common';
import { CourseSynchronizationHistory } from '../do';
import { CourseSynchronizationHistoryRepo, COURSE_SYNCHRONIZATION_HISTORY_REPO } from '../repo';

export class CourseSynchronizationHistoryService {
	constructor(
		@Inject(COURSE_SYNCHRONIZATION_HISTORY_REPO)
		private readonly courseSynchronizationHistoryRepo: CourseSynchronizationHistoryRepo
	) {}

	public async save(syncHistory: CourseSynchronizationHistory): Promise<CourseSynchronizationHistory> {
		const saveResult: CourseSynchronizationHistory = await this.courseSynchronizationHistoryRepo.save(syncHistory);

		return saveResult;
	}

	public async saveAll(syncHistories: CourseSynchronizationHistory[]): Promise<CourseSynchronizationHistory[]> {
		const saveResult: CourseSynchronizationHistory[] = await this.courseSynchronizationHistoryRepo.saveAll(
			syncHistories
		);

		return saveResult;
	}

	public async findByExternalGroupId(externalGroupId: string): Promise<CourseSynchronizationHistory[]> {
		const foundHistory: CourseSynchronizationHistory[] =
			await this.courseSynchronizationHistoryRepo.findByExternalGroupId(externalGroupId);

		return foundHistory;
	}
}
