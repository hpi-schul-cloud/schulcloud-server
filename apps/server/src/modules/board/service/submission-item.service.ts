import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { ValidationError } from '@shared/common/error/validation.error';
import {
	isSubmissionContainerElement,
	SubmissionContainerElement,
} from '@shared/domain/domainobject/board/submission-container-element.do';
import { SubmissionItem } from '@shared/domain/domainobject/board/submission-item.do';
import { EntityId } from '@shared/domain/types/entity-id';
import { ObjectId } from 'bson';
import { BoardDoRepo } from '../repo/board-do.repo';
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
		const submissionContainterElement = await this.boardDoRepo.findParentOfId(submissionItem.id);
		if (!isSubmissionContainerElement(submissionContainterElement)) {
			throw new UnprocessableEntityException();
		}

		const now = new Date();
		if (submissionContainterElement.dueDate && submissionContainterElement.dueDate < now) {
			throw new ValidationError('not allowed to save anymore');
		}
		submissionItem.completed = completed;

		await this.boardDoRepo.save(submissionItem, submissionContainterElement);
	}
}
