import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { AnyElementContentBody } from '../controller/dto';
import { AnyBoardNode, AnyContentElement, ColumnBoard, isContentElement, MediaBoard } from '../domain';
import { BoardNodeRepo } from '../repo/board-node.repo';
import { BoardNodeDeleteHooksService } from './internal/board-node-delete-hooks.service';
import { ContentElementUpdateService } from './internal/content-element-update.service';

type WithTitle<T> = Extract<T, { title: unknown }>;
type WithVisibility<T> = Extract<T, { isVisible: unknown }>;
type WithHeight<T> = Extract<T, { height: unknown }>;
type WithCompleted<T> = Extract<T, { completed: unknown }>;

@Injectable()
export class BoardNodeService {
	constructor(
		private readonly boardNodeRepo: BoardNodeRepo,
		private readonly contentElementUpdateService: ContentElementUpdateService,
		private readonly boardNodeDeleteHooksService: BoardNodeDeleteHooksService
	) {}

	async addRoot(boardNode: ColumnBoard | MediaBoard): Promise<void> {
		await this.boardNodeRepo.save(boardNode);
	}

	async addToParent(parent: AnyBoardNode, child: AnyBoardNode, position?: number): Promise<void> {
		parent.addChild(child, position);
		await this.boardNodeRepo.save(parent);
	}

	async updateTitle<T extends WithTitle<AnyBoardNode>>(node: T, title: T['title']) {
		node.title = title;
		await this.boardNodeRepo.save(node);
	}

	async updateVisibility<T extends WithVisibility<AnyBoardNode>>(node: T, isVisible: T['isVisible']) {
		node.isVisible = isVisible;
		await this.boardNodeRepo.save(node);
	}

	async updateHeight<T extends WithHeight<AnyBoardNode>>(node: T, height: T['height']) {
		node.height = height;
		await this.boardNodeRepo.save(node);
	}

	async updateCompleted<T extends WithCompleted<AnyBoardNode>>(node: T, completed: T['completed']) {
		node.completed = completed;
		await this.boardNodeRepo.save(node);
	}

	async updateContent(element: AnyContentElement, content: AnyElementContentBody): Promise<void> {
		await this.contentElementUpdateService.updateContent(element, content);
	}

	async move(child: AnyBoardNode, targetParent: AnyBoardNode, targetPosition?: number): Promise<void> {
		const saveList: AnyBoardNode[] = [];

		if (targetParent.hasChild(child)) {
			targetParent.removeChild(child);
		} else {
			const sourceParent = await this.findParent(child);
			if (sourceParent) {
				sourceParent.removeChild(child);
				saveList.concat(sourceParent.children);
			}
		}
		targetParent.addChild(child, targetPosition);
		saveList.concat(targetParent.children);

		await this.boardNodeRepo.save(saveList);
	}

	async findById(id: EntityId, depth?: number): Promise<AnyBoardNode> {
		const boardNode = this.boardNodeRepo.findById(id, depth);

		return boardNode;
	}

	async findByIds(ids: EntityId[], depth?: number): Promise<AnyBoardNode[]> {
		const boardNode = this.boardNodeRepo.findByIds(ids, depth);

		return boardNode;
	}

	async findByClassAndId<S, T extends AnyBoardNode>(
		Constructor: { new (props: S): T },
		id: EntityId,
		depth?: number
	): Promise<T> {
		const boardNode = await this.boardNodeRepo.findById(id, depth);
		if (!(boardNode instanceof Constructor)) {
			throw new NotFoundException(`There is no '${Constructor.name}' with this id`);
		}

		return boardNode;
	}

	async findByClassAndIds<S, T extends AnyBoardNode>(
		Constructor: { new (props: S): T },
		ids: EntityId[],
		depth?: number
	): Promise<T[]> {
		const boardNodes = await this.boardNodeRepo.findByIds(ids, depth);
		const filteredNodes = boardNodes.filter((node) => node instanceof Constructor);

		return filteredNodes as T[];
	}

	async findContentElementById(id: EntityId, depth?: number): Promise<AnyContentElement> {
		const boardNode = await this.boardNodeRepo.findById(id, depth);

		if (!isContentElement(boardNode)) {
			throw new NotFoundException(`There is no content element with this id`);
		}

		return boardNode;
	}

	async findParent(child: AnyBoardNode, depth?: number): Promise<AnyBoardNode | undefined> {
		const parentNode = child.parentId ? await this.boardNodeRepo.findById(child.parentId, depth) : undefined;

		return parentNode;
	}

	async findRoot(child: AnyBoardNode, depth?: number): Promise<AnyBoardNode> {
		const rootNode = await this.boardNodeRepo.findById(child.rootId, depth);

		return rootNode;
	}

	async delete(boardNode: AnyBoardNode): Promise<void> {
		const parent = await this.findParent(boardNode);
		if (parent) {
			parent.removeChild(boardNode);
		}
		await this.boardNodeRepo.delete(boardNode);
		await this.boardNodeDeleteHooksService.afterDelete(boardNode);
	}
}
