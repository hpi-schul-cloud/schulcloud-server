import { RuntimeConfigService } from '@infra/runtime-config';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { type EntityId } from '@shared/domain/types';
import { BOARD_IMPORT_PUBLIC_API_CONFIG_TOKEN, BoardImportPublicApiConfig } from '../board-import.config';
import {
	type BoardImportJob,
	BoardImportJobService,
	BoardImportSourceDisabledLoggableException,
	BoardImportSourceService,
	type BoardImportTarget,
} from '../domain';

@Injectable()
export class BoardImportUc {
	constructor(
		private readonly boardImportJobService: BoardImportJobService,
		private readonly boardImportSourceService: BoardImportSourceService,
		private readonly runtimeConfigService: RuntimeConfigService,
		@Inject(BOARD_IMPORT_PUBLIC_API_CONFIG_TOKEN) private readonly config: BoardImportPublicApiConfig
	) {}

	public async startImport(userId: EntityId, link: string, target: BoardImportTarget): Promise<BoardImportJob> {
		if (!this.config.featureBoardImportEnabled) {
			throw new FeatureDisabledLoggableException('FEATURE_BOARD_IMPORT_ENABLED');
		}

		const source = this.boardImportSourceService.resolveSource(link);

		const switchKey = this.boardImportSourceService.getSwitchKey(source.type);
		const isSourceEnabled = await this.runtimeConfigService.getBoolean(switchKey);
		if (!isSourceEnabled) {
			throw new BoardImportSourceDisabledLoggableException(source.type);
		}

		const job = await this.boardImportJobService.create(userId, source, target);

		return job;
	}

	public async getJob(userId: EntityId, jobId: EntityId): Promise<BoardImportJob> {
		const job = await this.boardImportJobService.findById(jobId);

		// A job of another user gives the same answer as a missing job, so that job ids cannot be probed.
		if (job?.userId !== userId) {
			throw new NotFoundException();
		}

		return job;
	}
}
