import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityId, SubmissionBoard, TaskElement } from '@shared/domain';
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

	async create(userId: EntityId, taskElement: TaskElement): Promise<SubmissionBoard> {
		const submission = new SubmissionBoard({
			id: new ObjectId().toHexString(),
			createdAt: new Date(),
			updatedAt: new Date(),
			completed: false,
			userId,
		});

		taskElement.addChild(submission);

		await this.boardDoRepo.save(taskElement.children, taskElement);

		return submission;
	}
}
