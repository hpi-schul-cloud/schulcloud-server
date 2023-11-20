import { Injectable, NotFoundException } from '@nestjs/common';
import {
	AnyBoardDo,
	AnyContentElementDo,
	Card,
	ColumnBoard,
	ContentElementFactory,
	ContentElementType,
	EntityId,
	isAnyContentElement,
	Permission,
	PermissionContextEntity,
	SubmissionContainerElement,
	SubmissionItem,
	UserDelta,
} from '@shared/domain';
import { CourseRepo, PermissionContextRepo } from '@shared/repo';
import { ObjectId } from 'bson';
import { AnyElementContentBody } from '../controller/dto';
import { BoardDoRepo } from '../repo';
import { BoardDoService } from './board-do.service';
import { ContentElementUpdateVisitor } from './content-element-update.visitor';

@Injectable()
export class ContentElementService {
	constructor(
		private readonly boardDoRepo: BoardDoRepo,
		private readonly boardDoService: BoardDoService,
		private readonly contentElementFactory: ContentElementFactory,
		private readonly permissionCtxRepo: PermissionContextRepo,
		private readonly courseRepo: CourseRepo
	) {}

	async findById(elementId: EntityId): Promise<AnyContentElementDo> {
		const element = await this.boardDoRepo.findById(elementId);

		if (!isAnyContentElement(element)) {
			throw new NotFoundException(`There is no '${element.constructor.name}' with this id`);
		}

		return element;
	}

	async findParentOfId(elementId: EntityId): Promise<AnyBoardDo> {
		const parent = await this.boardDoRepo.findParentOfId(elementId);
		if (!parent) {
			throw new NotFoundException('There is no node with this id');
		}
		return parent;
	}

	async pocCreateElementPermissionCtx(
		element: AnyContentElementDo,
		parent: Card | SubmissionItem,
		parentContext: PermissionContextEntity
	) {
		if (element instanceof SubmissionContainerElement) {
			// NOTE: this will be simplified once we have user groups
			const rootId = (await this.boardDoRepo.getAncestorIds(parent))[0];
			const columnBoard = await this.boardDoRepo.findByClassAndId(ColumnBoard, rootId);
			const course = await this.courseRepo.findById(columnBoard.context.id);
			const updatedStudentsPermissions = course.students.getItems().map((student) => {
				return {
					userId: student.id,
					includedPermissions: [Permission.BOARD_ELEMENT_CAN_SUBMIT],
					excludedPermissions: [],
				};
			});
			const permissionCtxEntity = new PermissionContextEntity({
				name: 'SubmissionContainerElement permission context',
				parentContext,
				contextReference: new ObjectId(element.id),
				userDelta: new UserDelta(updatedStudentsPermissions),
			});
			await this.permissionCtxRepo.save(permissionCtxEntity);
		} else {
			const permissionCtxEntity = new PermissionContextEntity({
				name: 'Element permission context',
				parentContext,
				contextReference: new ObjectId(element.id),
			});
			await this.permissionCtxRepo.save(permissionCtxEntity);
		}
	}

	async create(parent: Card | SubmissionItem, type: ContentElementType): Promise<AnyContentElementDo> {
		const element = this.contentElementFactory.build(type);
		parent.addChild(element);

		const parentContext = await this.permissionCtxRepo.findByContextReference(parent.id);
		await this.pocCreateElementPermissionCtx(element, parent, parentContext);

		await this.boardDoRepo.save(parent.children, parent);
		return element;
	}

	async delete(element: AnyContentElementDo): Promise<void> {
		await this.boardDoService.deleteWithDescendants(element);
	}

	async move(element: AnyContentElementDo, targetCard: Card, targetPosition: number): Promise<void> {
		await this.boardDoService.move(element, targetCard, targetPosition);
	}

	async update(element: AnyContentElementDo, content: AnyElementContentBody): Promise<AnyContentElementDo> {
		const updater = new ContentElementUpdateVisitor(content);
		await element.acceptAsync(updater);

		const parent = await this.boardDoRepo.findParentOfId(element.id);

		await this.boardDoRepo.save(element, parent);

		return element;
	}
}
