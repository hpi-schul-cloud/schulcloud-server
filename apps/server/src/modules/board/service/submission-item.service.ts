import { ObjectId } from 'bson';
import { Injectable, NotFoundException } from '@nestjs/common';

import { EntityId, SubmissionContainerElement, SubmissionItem } from '@shared/domain';
import {BusinessError, ValidationError} from '@shared/common';

import { BoardDoRepo } from '../repo';
import { BoardDoService } from './board-do.service';

@Injectable()
export class SubmissionItemService {
	constructor(private readonly boardDoRepo: BoardDoRepo, private readonly boardDoService: BoardDoService) {}

	async findById(id: EntityId): Promise<SubmissionItem> {
		const element = await this.boardDoRepo.findById(id);

		if (!(element instanceof SubmissionItem)) {
			throw new NotFoundException(`There is no '${element.constructor.name}' with this id`);
		}

		return element;
	}

	async create(
		userId: EntityId,
		submissionContainer: SubmissionContainerElement,
		payload: { completed: boolean }
	): Promise<SubmissionItem> {
		const submissionItem = new SubmissionItem({
			id: new ObjectId().toHexString(),
			createdAt: new Date(),
			updatedAt: new Date(),
			completed: payload.completed,
			userId,
		});

		submissionContainer.addChild(submissionItem);

		await this.boardDoRepo.save(submissionContainer.children, submissionContainer);

		return submissionItem;
	}

	async update(submissionItem: SubmissionItem, completed: boolean): Promise<void> {
		const parent = (await this.boardDoRepo.findParentOfId(submissionItem.id)) as SubmissionContainerElement;
		const now = new Date();
		if (parent.dueDate && parent.dueDate < now) {
			throw new ValidationError('not allowed to save anymore');
		}
		submissionItem.completed = completed;

		await this.boardDoRepo.save(submissionItem, parent);
	}
}
