import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { AnyBoardNode, AnyContentElement, ColumnBoard, isContentElement, MediaBoard } from '../domain';
import { BoardNodeRepo } from '../repo';
import { BoardNodeDeleteHooksService } from './board-node-delete-hooks.service';

type WithTitle<T> = Extract<T, { title: unknown }>;
type WithVisibility<T> = Extract<T, { isVisible: unknown }>;
type WithHeight<T> = Extract<T, { height: unknown }>;
type WithCompleted<T> = Extract<T, { completed: unknown }>;

@Injectable()
export class BoardNodeService {
	constructor(
		private readonly boardNodeRepo: BoardNodeRepo,
		private readonly boardNodeDeleteHooksService: BoardNodeDeleteHooksService
	) {}

	async addRoot(boardNode: ColumnBoard | MediaBoard): Promise<void> {
		await this.boardNodeRepo.persistAndFlush(boardNode);
	}

	async addToParent(parent: AnyBoardNode, child: AnyBoardNode, position?: number): Promise<void> {
		parent.addChild(child, position);
		await this.boardNodeRepo.persistAndFlush(parent);
	}

	async updateTitle<T extends WithTitle<AnyBoardNode>>(node: T, title: T['title']) {
		node.title = title;
		await this.boardNodeRepo.persistAndFlush(node);
	}

	async updateVisibility<T extends WithVisibility<AnyBoardNode>>(node: T, isVisible: T['isVisible']) {
		node.isVisible = isVisible;
		await this.boardNodeRepo.persistAndFlush(node);
	}

	async updateHeight<T extends WithHeight<AnyBoardNode>>(node: T, height: T['height']) {
		node.height = height;
		await this.boardNodeRepo.persistAndFlush(node);
	}

	async updateCompleted<T extends WithCompleted<AnyBoardNode>>(node: T, completed: T['completed']) {
		node.completed = completed;
		await this.boardNodeRepo.persistAndFlush(node);
	}

	async move(childId: EntityId, targetParentId: EntityId, targetPosition?: number): Promise<void> {
		const child = await this.findById(childId);
		const parent = await this.findParent(child);
		const targetParent = await this.findById(targetParentId);

		// TODO should we make sure child and targetParent belonging to the same board?

		if (parent) {
			parent.removeChild(child);
		}
		targetParent.addChild(child, targetPosition);

		await this.boardNodeRepo.flush();
	}

	async findById(id: EntityId, depth?: number): Promise<AnyBoardNode> {
		const boardNode = this.boardNodeRepo.findById(id, depth);

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

		if (filteredNodes.length !== ids.length) {
			throw new NotFoundException(`There is no '${Constructor.name}' with these ids`);
		}

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

	async delete(boardNode: AnyBoardNode | AnyBoardNode[]): Promise<void> {
		await this.boardNodeRepo.removeAndFlush(boardNode);
		await this.boardNodeDeleteHooksService.afterDelete(boardNode);
	}
}
