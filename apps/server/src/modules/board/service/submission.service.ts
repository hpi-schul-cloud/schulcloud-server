import { Injectable, NotFoundException } from '@nestjs/common';
import { AnyContentSubElementDo, EntityId, SubmissionBoard, TaskElement } from '@shared/domain';
import { ObjectId } from 'bson';
import { BoardDoRepo } from '../repo';

@Injectable()
export class SubmissionBoardService {
	constructor(private readonly boardDoRepo: BoardDoRepo) {}

	async findById(id: EntityId): Promise<SubmissionBoard> {
		const element = await this.boardDoRepo.findById(id);

		if (!(element instanceof SubmissionBoard)) {
			throw new NotFoundException(`There is no '${element.constructor.name}' with this id`);
		}

		return element;
	}

	async create(userId: EntityId, parent: TaskElement): Promise<AnyContentSubElementDo> {
		const submission = new SubmissionBoard({
			id: new ObjectId().toHexString(),
			createdAt: new Date(),
			updatedAt: new Date(),
			completed: false,
			userId,
		});

		parent.addChild(submission);

		await this.boardDoRepo.save(parent.children, parent);

		return submission;
	}
}
