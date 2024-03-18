import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { ObjectId } from '@mikro-orm/mongodb';

import { ValidationError } from '@shared/common';
import { isSubmissionContainerElement, SubmissionContainerElement, SubmissionItem } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';

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
		this.checkNotLocked(submissionContainer);

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
		const parent = await this.getParent(submissionItem);

		submissionItem.completed = completed;

		await this.boardDoRepo.save(submissionItem, parent);
	}

	async delete(submissionItem: SubmissionItem): Promise<void> {
		await this.getParent(submissionItem);

		await this.boardDoRepo.delete(submissionItem);
	}

	private async getParent(submissionItem: SubmissionItem): Promise<SubmissionContainerElement> {
		const submissionContainterElement = await this.boardDoRepo.findParentOfId(submissionItem.id);

		if (!isSubmissionContainerElement(submissionContainterElement)) {
			throw new UnprocessableEntityException();
		}

		this.checkNotLocked(submissionContainterElement);

		return submissionContainterElement;
	}

	private checkNotLocked(submissionContainterElement: SubmissionContainerElement): void {
		const now = new Date();
		if (submissionContainterElement.dueDate && submissionContainterElement.dueDate < now) {
			throw new ValidationError('not allowed to save anymore');
		}
	}
}
