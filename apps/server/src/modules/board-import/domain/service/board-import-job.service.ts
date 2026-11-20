import { ObjectId } from '@mikro-orm/mongodb';
import { Inject, Injectable } from '@nestjs/common';
import { type EntityId } from '@shared/domain/types';
import { BoardImportJobProducer } from '../../amqp';
import { BOARD_IMPORT_CONFIG_TOKEN, BoardImportConfig } from '../../board-import.config';
import { BoardImportJob } from '../do';
import { BOARD_IMPORT_JOB_REPO, type BoardImportJobRepo } from '../interface';
import { BoardImportJobStatus } from '../type';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class BoardImportJobService {
	constructor(
		@Inject(BOARD_IMPORT_JOB_REPO) private readonly boardImportJobRepo: BoardImportJobRepo,
		@Inject(BOARD_IMPORT_CONFIG_TOKEN) private readonly config: BoardImportConfig,
		private readonly boardImportJobProducer: BoardImportJobProducer
	) {}

	public async create(userId: EntityId, link: string): Promise<BoardImportJob> {
		const expiresAt = new Date(Date.now() + this.config.jobRetentionInDays * MILLISECONDS_PER_DAY);
		const job = new BoardImportJob({
			id: new ObjectId().toHexString(),
			status: BoardImportJobStatus.WAITING,
			userId,
			link,
			expiresAt,
		});

		const savedJob = await this.boardImportJobRepo.save(job);

		await this.boardImportJobProducer.publishJob({ jobId: savedJob.id }, savedJob.expiresAt);

		return savedJob;
	}

	public async findById(id: EntityId): Promise<BoardImportJob | null> {
		const job = await this.boardImportJobRepo.findById(id);

		return job;
	}
}
