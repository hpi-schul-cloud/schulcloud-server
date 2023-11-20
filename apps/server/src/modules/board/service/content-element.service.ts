import { Injectable, NotFoundException } from '@nestjs/common';
import {
	AnyBoardDo,
	AnyContentElementDo,
	Card,
	ContentElementFactory,
	ContentElementType,
	EntityId,
	isAnyContentElement,
	PermissionContextEntity,
	SubmissionItem,
} from '@shared/domain';
import { PermissionContextRepo } from '@shared/repo';
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
		private readonly permissionCtxRepo: PermissionContextRepo
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

	async pocCreateElementPermissionCtx(element: AnyContentElementDo, parentContext: PermissionContextEntity) {
		const permissionCtxEntity = new PermissionContextEntity({
			name: 'Element permission context',
			parentContext,
			contextReference: new ObjectId(element.id),
		});
		await this.permissionCtxRepo.save(permissionCtxEntity);
	}

	async create(parent: Card | SubmissionItem, type: ContentElementType): Promise<AnyContentElementDo> {
		const element = this.contentElementFactory.build(type);
		parent.addChild(element);

		const parentContext = await this.permissionCtxRepo.findByContextReference(parent.id);

		const permissionCtxEntity = new PermissionContextEntity({
			name: 'Card permission context',
			parentContext,
			contextReference: new ObjectId(element.id),
		});
		await this.pocCreateElementPermissionCtx(element, parentContext);
		await this.permissionCtxRepo.save(permissionCtxEntity);

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
