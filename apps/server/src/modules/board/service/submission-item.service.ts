import { ObjectId } from 'bson';
import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';

import {
	ColumnBoard,
	EntityId,
	isSubmissionContainerElement,
	PermissionContextEntity,
	PermissionCrud,
	SubmissionContainerElement,
	SubmissionItem,
	UserDelta,
} from '@shared/domain';
import { ValidationError } from '@shared/common';

import { CourseRepo, PermissionContextRepo } from '@shared/repo';
import { BoardDoRepo } from '../repo';
import { BoardDoService } from './board-do.service';

@Injectable()
export class SubmissionItemService {
	constructor(
		private readonly boardDoRepo: BoardDoRepo,
		private readonly boardDoService: BoardDoService,
		private readonly permissionCtxRepo: PermissionContextRepo,
		private readonly courseRepo: CourseRepo
	) {}

	private async pocCreateSubmissionItemPermissionCtx(
		userId: EntityId,
		submissionContainer: SubmissionContainerElement,
		submissionItemId: EntityId
	) {
		// NOTE: this will be simplified once we have user groups
		const parentContext = await this.permissionCtxRepo.findByContextReference(submissionContainer.id);

		const rootId = (await this.boardDoRepo.getAncestorIds(submissionContainer))[0];
		const columnBoard = await this.boardDoRepo.findByClassAndId(ColumnBoard, rootId);
		const course = await this.courseRepo.findById(columnBoard.context.id);
		const revokeStudentsPermissions = course.students
			.getItems()
			.filter((student) => student.id !== userId)
			.map((student) => {
				return {
					userId: student.id,
					includedPermissions: [],
					excludedPermissions: [PermissionCrud.UPDATE, PermissionCrud.DELETE],
				};
			});

		const permissionCtxEntity = new PermissionContextEntity({
			name: 'Element permission context',
			parentContext,
			contextReference: new ObjectId(submissionItemId),
			userDelta: new UserDelta(revokeStudentsPermissions),
		});
		await this.permissionCtxRepo.save(permissionCtxEntity);
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
