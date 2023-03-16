import { Utils } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { CardNode, EntityId, TextElement } from '@shared/domain';
import { BoardNodeBuilderImpl } from '@shared/domain/entity/boardnode/board-node-builder-impl';
import { BoardNodeRepo } from './board-node.repo';

@Injectable()
export class ContentElementRepo {
	constructor(private readonly em: EntityManager, private readonly boardNodeRepo: BoardNodeRepo) {}

	async save(element: TextElement | TextElement[], parentId: EntityId) {
		const elements = Utils.asArray(element);
		const parent = await this.boardNodeRepo.findById(CardNode, parentId);
		const builder = new BoardNodeBuilderImpl(parent);
		const elementNodes = builder.buildBoardNodes(elements, parent.id);
		await this.boardNodeRepo.save(elementNodes);
	}
}
