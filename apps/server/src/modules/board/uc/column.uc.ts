import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Card, ContentElementType, EntityId, PermissionCrud } from '@shared/domain';
import { LegacyLogger } from '@src/core/logger';
import { AuthorizationService, PermissionContextService } from '@modules/authorization';
import { CardService, ColumnService, BoardDoAuthorizableService } from '../service';
import { BaseUc } from './base.uc';

@Injectable()
export class ColumnUc extends BaseUc {
	constructor(
		@Inject(forwardRef(() => AuthorizationService))
		protected readonly authorizationService: AuthorizationService,
		protected readonly boardDoAuthorizableService: BoardDoAuthorizableService,
		private readonly cardService: CardService,
		private readonly columnService: ColumnService,
		private readonly logger: LegacyLogger,
		protected readonly permissionContextService: PermissionContextService
	) {
		super(authorizationService, boardDoAuthorizableService, permissionContextService);
		this.logger.setContext(ColumnUc.name);
	}

	async deleteColumn(userId: EntityId, columnId: EntityId): Promise<void> {
		this.logger.debug({ action: 'deleteColumn', userId, columnId });

		await this.pocCheckPermission(userId, columnId, [PermissionCrud.DELETE]);

		const column = await this.columnService.findById(columnId);
		// await this.checkPermission(userId, column, Action.write);

		await this.columnService.delete(column);
	}

	async updateColumnTitle(userId: EntityId, columnId: EntityId, title: string): Promise<void> {
		this.logger.debug({ action: 'updateColumnTitle', userId, columnId, title });

		await this.pocCheckPermission(userId, columnId, [PermissionCrud.UPDATE]);

		const column = await this.columnService.findById(columnId);
		// await this.checkPermission(userId, column, Action.write);

		await this.columnService.updateTitle(column, title);
	}

	async createCard(userId: EntityId, columnId: EntityId, requiredEmptyElements?: ContentElementType[]): Promise<Card> {
		this.logger.debug({ action: 'createCard', userId, columnId });

		await this.pocCheckPermission(userId, columnId, [PermissionCrud.CREATE]);
		const column = await this.columnService.findById(columnId);
		// await this.checkPermission(userId, column, Action.read);

		const card = await this.cardService.create(column, requiredEmptyElements);

		return card;
	}

	async moveCard(userId: EntityId, cardId: EntityId, targetColumnId: EntityId, targetPosition: number): Promise<void> {
		this.logger.debug({ action: 'moveCard', userId, cardId, targetColumnId, toPosition: targetPosition });

		await this.pocCheckPermission(userId, cardId, [PermissionCrud.UPDATE]);
		await this.pocCheckPermission(userId, targetColumnId, [PermissionCrud.UPDATE]);

		const card = await this.cardService.findById(cardId);
		const targetColumn = await this.columnService.findById(targetColumnId);

		// await this.checkPermission(userId, card, Action.write);
		// await this.checkPermission(userId, targetColumn, Action.write);

		await this.cardService.move(card, targetColumn, targetPosition);
	}
}
