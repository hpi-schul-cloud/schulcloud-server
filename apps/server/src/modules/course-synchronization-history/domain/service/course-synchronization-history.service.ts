import { Inject } from '@nestjs/common';
import { CourseSynchronizationHistory } from '../do';
import { CourseSynchronizationHistoryRepo, COURSE_SYNCHRONIZATION_HISTORY_REPO } from '../interface';

export class CourseSynchronizationHistoryService {
	constructor(
		@Inject(COURSE_SYNCHRONIZATION_HISTORY_REPO)
		private readonly courseSynchronizationHistoryRepo: CourseSynchronizationHistoryRepo
	) {}

	public async saveAll(courseSyncHistories: CourseSynchronizationHistory[]): Promise<CourseSynchronizationHistory[]> {
		const saveResult: CourseSynchronizationHistory[] = await this.courseSynchronizationHistoryRepo.saveAll(
			courseSyncHistories
		);

		return saveResult;
	}

	public async findByExternalGroupId(externalGroupId: string): Promise<CourseSynchronizationHistory[]> {
		const foundHistory: CourseSynchronizationHistory[] =
			await this.courseSynchronizationHistoryRepo.findByExternalGroupId(externalGroupId);

		return foundHistory;
	}

	public async delete(
		courseSyncHistories: CourseSynchronizationHistory[] | CourseSynchronizationHistory
	): Promise<void> {
		await this.courseSynchronizationHistoryRepo.delete(courseSyncHistories);
	}
}
