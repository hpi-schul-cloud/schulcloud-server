import { ObjectId } from 'bson';
import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';

import {
	AnyBoardDo,
	EntityId,
	isSubmissionContainerElement,
	SubmissionContainerElement,
	SubmissionItem,
} from '@shared/domain';
import { ValidationError } from '@shared/common';

import { CourseRepo, PermissionContextRepo } from '@shared/repo';
import { BoardDoRepo } from '../repo';
import { BoardDoService } from './board-do.service';
import { BaseService } from './base.service';

@Injectable()
export class SubmissionItemService extends BaseService {
	constructor(
		protected readonly boardDoRepo: BoardDoRepo,
		private readonly boardDoService: BoardDoService,
		protected readonly permissionCtxRepo: PermissionContextRepo,
		protected readonly courseRepo: CourseRepo
	) {
		super(permissionCtxRepo, boardDoRepo, courseRepo);
	}

	async findStudents(boardDo: AnyBoardDo) {
		return (await this.findCourseMembers(boardDo)).students;
	}

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
		await this.pocCreateSubmissionItemPermissionCtx(userId, submissionContainer, submissionItem.id);
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
