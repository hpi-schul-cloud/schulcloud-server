import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { type EntityId } from '@shared/domain/types';
import { BoardImportJob } from '../do';
import { BoardImportJobStatus } from '../type';

@Injectable()
export class BoardImportJobService {
	public create(userId: EntityId, link: string): Promise<BoardImportJob> {
		const job = new BoardImportJob({
			id: new ObjectId().toHexString(),
			status: BoardImportJobStatus.WAITING,
			userId,
			link,
		});

		// No worker can take the job, so it must not stay in the status "waiting".
		job.status = BoardImportJobStatus.FAILED;

		return Promise.resolve(job);
	}

	// Jobs are not stored.
	public findById(_id: EntityId): Promise<BoardImportJob | null> {
		return Promise.resolve(null);
	}
}
