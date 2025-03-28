import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CourseSynchronizationHistoryConfig } from '../course-synchronization-history.config';
import {
	CourseSynchronizationHistory,
	CourseSynchronizationHistoryFactory,
	CourseSynchronizationHistorySaveProps,
} from '../do';
import { CourseSynchronizationHistoryRepo, COURSE_SYNCHRONIZATION_HISTORY_REPO } from '../repo';

export class CourseSynchronizationHistoryService {
	constructor(
		@Inject(COURSE_SYNCHRONIZATION_HISTORY_REPO)
		private readonly courseSynchronizationHistoryRepo: CourseSynchronizationHistoryRepo,
		private readonly configService: ConfigService<CourseSynchronizationHistoryConfig, true>
	) {}

	public async save(saveProps: CourseSynchronizationHistorySaveProps): Promise<CourseSynchronizationHistory> {
		const expirationInSeconds = this.configService.getOrThrow<number>(
			'COURSE_SYNCHRONIZATION_HISTORY_EXPIRES_IN_SECONDS'
		);

		const history = CourseSynchronizationHistoryFactory.build({
			...saveProps,
			expirationDate: new Date(Date.now() + expirationInSeconds * 1000),
		});

		const saveResult: CourseSynchronizationHistory = await this.courseSynchronizationHistoryRepo.save(history);

		return saveResult;
	}

	public async saveAll(
		savePropsList: CourseSynchronizationHistorySaveProps[]
	): Promise<CourseSynchronizationHistory[]> {
		const expirationInSeconds = this.configService.getOrThrow<number>(
			'COURSE_SYNCHRONIZATION_HISTORY_EXPIRES_IN_SECONDS'
		);

		const syncHistories: CourseSynchronizationHistory[] = savePropsList.map(
			(saveProps: CourseSynchronizationHistorySaveProps) =>
				CourseSynchronizationHistoryFactory.build({
					...saveProps,
					expirationDate: new Date(Date.now() + expirationInSeconds * 1000),
				})
		);

		const saveResult: CourseSynchronizationHistory[] = await this.courseSynchronizationHistoryRepo.saveAll(
			syncHistories
		);

		return saveResult;
	}

	public async findByExternalGroupId(externalGroupId: string): Promise<CourseSynchronizationHistory | null> {
		const foundHistory: CourseSynchronizationHistory | null =
			await this.courseSynchronizationHistoryRepo.findByExternalGroupId(externalGroupId);

		return foundHistory;
	}
}
