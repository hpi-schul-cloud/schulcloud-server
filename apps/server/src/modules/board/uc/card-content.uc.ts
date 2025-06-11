import { LegacyLogger } from '@core/logger';
import { Injectable } from '@nestjs/common';
import { BoardNodeFactory, Card, Column, ContentElementType } from '../domain';
import { EntityId } from '@shared/domain/types';
import { BoardNodePermissionService, BoardNodeService } from '../service';
import { Action } from '@modules/authorization';

@Injectable()
export class CardContentUc {
	constructor(
		private readonly logger: LegacyLogger,
		private readonly boardNodePermissionService: BoardNodePermissionService,
		private readonly boardNodeService: BoardNodeService,
		private readonly boardNodeFactory: BoardNodeFactory
	) {
		this.logger.setContext(CardContentUc.name);
	}

	public async createCardWithContent(
		userId: EntityId,
		columnId: EntityId,
		requiredEmptyElements: ContentElementType[] = []
	): Promise<Card> {
		this.logger.debug({ action: 'createCardWithContent' });
		const column = await this.boardNodeService.findByClassAndId(Column, columnId);
		await this.boardNodePermissionService.checkPermission(userId, column, Action.write);

		const elements = requiredEmptyElements.map((type) => this.boardNodeFactory.buildContentElement(type));
		const card = this.boardNodeFactory.buildCard(elements);
		const element = this.boardNodeFactory.buildContentElement(type);

		await this.boardNodeService.addToParent(column, card);

		return card;
	}
}
