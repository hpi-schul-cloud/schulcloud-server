import { ObjectId } from '@mikro-orm/mongodb';
import { Inject, Injectable } from '@nestjs/common';
import { type EntityId } from '@shared/domain/types';
import { BoardImportJobProducer } from '../../amqp';
import { BOARD_IMPORT_CONFIG_TOKEN, BoardImportConfig } from '../../board-import.config';
import { BoardImportJob } from '../do';
import { BOARD_IMPORT_JOB_REPO, type BoardImportJobRepo } from '../interface';
import { BoardImportJobStatus, type BoardImportSource, type BoardImportTarget } from '../type';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class BoardImportJobService {
	constructor(
		@Inject(BOARD_IMPORT_JOB_REPO) private readonly boardImportJobRepo: BoardImportJobRepo,
		@Inject(BOARD_IMPORT_CONFIG_TOKEN) private readonly config: BoardImportConfig,
		private readonly boardImportJobProducer: BoardImportJobProducer
	) {}

	public async create(userId: EntityId, source: BoardImportSource, target: BoardImportTarget): Promise<BoardImportJob> {
		const expiresAt = new Date(Date.now() + this.config.jobRetentionInDays * MILLISECONDS_PER_DAY);
		const job = new BoardImportJob({
			id: new ObjectId().toHexString(),
			status: BoardImportJobStatus.WAITING,
			userId,
			source,
			target,
			expiresAt,
			attempts: 0,
		});

		const savedJob = await this.boardImportJobRepo.save(job);

		try {
			await this.boardImportJobProducer.publishJob({ jobId: savedJob.id }, savedJob.expiresAt);
		} catch (error) {
			// The broker can still enqueue a message after a publish error. The job fails only if no worker took it.
			const isFailed = await this.boardImportJobRepo.failIfWaiting(savedJob.id);
			const startedJob = isFailed ? null : await this.boardImportJobRepo.findById(savedJob.id);

			if (!startedJob) {
				throw error;
			}

			return startedJob;
		}

		return savedJob;
	}

	public async findById(id: EntityId): Promise<BoardImportJob | null> {
		const job = await this.boardImportJobRepo.findById(id);

		return job;
	}
}
