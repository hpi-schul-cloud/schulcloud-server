import { ObjectId } from '@mikro-orm/mongodb';
import { Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { BoardImportJob } from '../do';
import { BOARD_IMPORT_JOB_REPO, BoardImportJobRepo } from '../interface';
import { BoardImportJobStatus } from '../type';

@Injectable()
export class BoardImportJobService {
	constructor(@Inject(BOARD_IMPORT_JOB_REPO) private readonly boardImportJobRepo: BoardImportJobRepo) {}

	public async create(userId: EntityId, link: string): Promise<BoardImportJob> {
		const job = new BoardImportJob({
			id: new ObjectId().toHexString(),
			status: BoardImportJobStatus.WAITING,
			userId,
			link,
		});

		const savedJob = await this.boardImportJobRepo.save(job);

		return savedJob;
	}

	public async findById(id: EntityId): Promise<BoardImportJob | null> {
		const job = await this.boardImportJobRepo.findById(id);

		return job;
	}

	public async save(job: BoardImportJob): Promise<BoardImportJob> {
		const savedJob = await this.boardImportJobRepo.save(job);

		return savedJob;
	}
}
