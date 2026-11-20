import { Injectable, NotFoundException } from '@nestjs/common';
import { type EntityId } from '@shared/domain/types';
import { BoardImportJobProducer } from '../amqp';
import { type BoardImportJob, BoardImportJobService } from '../domain';

@Injectable()
export class BoardImportUc {
	constructor(
		private readonly boardImportJobService: BoardImportJobService,
		private readonly boardImportJobProducer: BoardImportJobProducer
	) {}

	public async startImport(userId: EntityId, link: string): Promise<BoardImportJob> {
		const job = await this.boardImportJobService.create(userId, link);

		await this.boardImportJobProducer.publishJob({ jobId: job.id });

		return job;
	}

	public async getJob(userId: EntityId, jobId: EntityId): Promise<BoardImportJob> {
		const job = await this.boardImportJobService.findById(jobId);

		// A job of another user gives the same answer as a missing job, so that job ids cannot be probed.
		if (!job || job.userId !== userId) {
			throw new NotFoundException();
		}

		return job;
	}
}
