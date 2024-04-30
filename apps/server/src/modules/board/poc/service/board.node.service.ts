import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { AnyBoardNode } from '../domain';
import { BoardNodeRepo } from '../repo';

type WithTitle<T> = Extract<T, { title: unknown }>;
type WithVisibility<T> = Extract<T, { isVisible: unknown }>;
type WithHeight<T> = Extract<T, { height: unknown }>;

@Injectable()
export class BoardNodeService {
	constructor(@Inject(BoardNodeRepo) private readonly boardNodeRepo: BoardNodeRepo) {}

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

	async move(child: AnyBoardNode, targetParent: AnyBoardNode, targetPosition?: number): Promise<void> {
		// TODO optimize performance
		const parentId = child.ancestorIds[child.ancestorIds.length - 1];
		const parentNode = await this.boardNodeRepo.findById(parentId, 1);

		parentNode.removeChild(child);
		targetParent.addChild(child, targetPosition);

		await this.boardNodeRepo.flush();
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

	async findParent(child: AnyBoardNode, depth?: number): Promise<AnyBoardNode | undefined> {
		const parentNode = child.parentId ? await this.boardNodeRepo.findById(child.parentId, depth) : undefined;

		return parentNode;
	}

	async findRoot(child: AnyBoardNode, depth?: number): Promise<AnyBoardNode> {
		const rootId = [...child.ancestorIds, child.id][0];
		const rootNode = await this.boardNodeRepo.findById(rootId, depth);

		return rootNode;
	}
}
