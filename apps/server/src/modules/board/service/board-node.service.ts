import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { AnyElementContentBody } from '../controller/dto';
import {
	AnyBoardNode,
	AnyContentElement,
	AnyMediaElement,
	ColumnBoard,
	isAnyMediaElement,
	isContentElement,
	MediaBoard,
} from '../domain';
import { BoardNodeRepo } from '../repo/board-node.repo';
import { BoardNodeDeleteHooksService } from './internal/board-node-delete-hooks.service';
import { ContentElementUpdateService } from './internal/content-element-update.service';

type WithTitle<T> = Extract<T, { title: unknown }>;
type WithVisibility<T> = Extract<T, { isVisible: unknown }>;
type WithLayout<T> = Extract<T, { layout: unknown }>;
type WithHeight<T> = Extract<T, { height: unknown }>;
type WithCompleted<T> = Extract<T, { completed: unknown }>;

@Injectable()
export class BoardNodeService {
	constructor(
		private readonly boardNodeRepo: BoardNodeRepo,
		private readonly contentElementUpdateService: ContentElementUpdateService,
		private readonly boardNodeDeleteHooksService: BoardNodeDeleteHooksService
	) {}

	public async addRoot(boardNode: ColumnBoard | MediaBoard): Promise<void> {
		await this.boardNodeRepo.save(boardNode);
	}

	public async addToParent(parent: AnyBoardNode, child: AnyBoardNode, position?: number): Promise<void> {
		parent.addChild(child, position);

		await this.boardNodeRepo.save(parent);
	}

	public async updateTitle<T extends WithTitle<AnyBoardNode>>(node: T, title: T['title']): Promise<void> {
		node.title = title;
		await this.boardNodeRepo.save(node);
	}

	public async updateVisibility<T extends WithVisibility<AnyBoardNode>>(
		node: T,
		isVisible: T['isVisible']
	): Promise<void> {
		node.isVisible = isVisible;
		await this.boardNodeRepo.save(node);
	}

	public async updateLayout<T extends WithLayout<AnyBoardNode>>(node: T, layout: T['layout']): Promise<void> {
		node.layout = layout;
		await this.boardNodeRepo.save(node);
	}

	public async updateHeight<T extends WithHeight<AnyBoardNode>>(node: T, height: T['height']): Promise<void> {
		node.height = height;
		await this.boardNodeRepo.save(node);
	}

	public async updateCompleted<T extends WithCompleted<AnyBoardNode>>(
		node: T,
		completed: T['completed']
	): Promise<void> {
		node.completed = completed;
		await this.boardNodeRepo.save(node);
	}

	public async updateContent(element: AnyContentElement, content: AnyElementContentBody): Promise<void> {
		await this.contentElementUpdateService.updateContent(element, content);
	}

	public async replace(oldNode: AnyBoardNode, newNode: AnyBoardNode): Promise<void> {
		const parent: AnyBoardNode | undefined = await this.findParent(oldNode);

		if (!parent) {
			throw new NotFoundException(`Unable to find a parent node for ${oldNode.id}`);
		}

		parent.addChild(newNode);
		await this.boardNodeRepo.save(parent);

		await this.delete(oldNode);
	}

	public async move(child: AnyBoardNode, targetParent: AnyBoardNode, targetPosition?: number): Promise<void> {
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

	public async findById(id: EntityId, depth?: number): Promise<AnyBoardNode> {
		const boardNode = await this.boardNodeRepo.findById(id, depth);

		return boardNode;
	}

	public async findByIds(ids: EntityId[], depth?: number): Promise<AnyBoardNode[]> {
		const boardNode = await this.boardNodeRepo.findByIds(ids, depth);

		return boardNode;
	}

	public async findByClassAndId<S, T extends AnyBoardNode>(
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

	public async findByClassAndIds<S, T extends AnyBoardNode>(
		Constructor: { new (props: S): T },
		ids: EntityId[],
		depth?: number
	): Promise<T[]> {
		const boardNodes = await this.boardNodeRepo.findByIds(ids, depth);
		const filteredNodes = boardNodes.filter((node) => node instanceof Constructor);

		return filteredNodes as T[];
	}

	public async findContentElementById(id: EntityId, depth?: number): Promise<AnyContentElement> {
		const boardNode = await this.boardNodeRepo.findById(id, depth);

		if (!isContentElement(boardNode)) {
			throw new NotFoundException(`There is no content element with this id`);
		}

		return boardNode;
	}

	public async findAnyMediaElementById(id: EntityId, depth?: number): Promise<AnyMediaElement> {
		const boardNode = await this.boardNodeRepo.findById(id, depth);

		if (!isAnyMediaElement(boardNode)) {
			throw new NotFoundException(`There is no content element with this id`);
		}

		return boardNode;
	}

	public async findParent(child: AnyBoardNode, depth?: number): Promise<AnyBoardNode | undefined> {
		const parentNode = child.parentId ? await this.boardNodeRepo.findById(child.parentId, depth) : undefined;

		return parentNode;
	}

	public async findRoot(child: AnyBoardNode, depth?: number): Promise<AnyBoardNode> {
		const rootNode = await this.boardNodeRepo.findById(child.rootId, depth);

		return rootNode;
	}

	public async findElementsByContextExternalToolId(contextExternalToolId: EntityId): Promise<AnyBoardNode[]> {
		const elements: AnyBoardNode[] = await this.boardNodeRepo.findByContextExternalToolIds([contextExternalToolId]);

		return elements;
	}

	public async delete(boardNode: AnyBoardNode): Promise<void> {
		const parent = await this.findParent(boardNode);
		if (parent) {
			parent.removeChild(boardNode);
		}
		await this.boardNodeRepo.delete(boardNode);
		await this.boardNodeDeleteHooksService.afterDelete(boardNode);
	}
}
