import { Inject, Injectable } from '@nestjs/common';
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
}
