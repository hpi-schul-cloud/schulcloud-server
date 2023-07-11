import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityId, SubmissionBoard, SubmissionContainerElement } from '@shared/domain';
import { ObjectId } from 'bson';
import { BoardDoRepo } from '../repo';
import { BoardDoService } from './board-do.service';

@Injectable()
export class SubmissionBoardService {
	constructor(private readonly boardDoRepo: BoardDoRepo, private readonly boardDoService: BoardDoService) {}

	async findById(id: EntityId): Promise<SubmissionBoard> {
		const element = await this.boardDoRepo.findById(id);

		if (!(element instanceof SubmissionBoard)) {
			throw new NotFoundException(`There is no '${element.constructor.name}' with this id`);
		}

		return element;
	}

	async create(userId: EntityId, submissionContainer: SubmissionContainerElement): Promise<SubmissionBoard> {
		const submission = new SubmissionBoard({
			id: new ObjectId().toHexString(),
			createdAt: new Date(),
			updatedAt: new Date(),
			completed: false,
			userId,
		});

		submissionContainer.addChild(submission);

		await this.boardDoRepo.save(submissionContainer.children, submissionContainer);

		return submission;
	}

	async delete(submission: SubmissionBoard): Promise<void> {
		await this.boardDoService.deleteWithDescendants(submission);
	}
}
