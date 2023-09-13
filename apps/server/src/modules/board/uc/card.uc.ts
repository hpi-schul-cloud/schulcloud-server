import { Injectable, NotFoundException } from "@nestjs/common";
import {
	AnyBoardDo,
	Card,
	ContentElementType,
	EntityId,
	FileElement,
	RichTextElement,
	SubmissionContainerElement,
} from '@shared/domain';
import { LegacyLogger } from '@src/core/logger';
import { AuthorizationService } from '@src/modules/authorization/authorization.service';
import { Action } from '@src/modules/authorization/types/action.enum';
import { DrawingElement } from '@shared/domain/domainobject/board/drawing-element.do';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { Configuration } from '@hpi-schul-cloud/commons';
import { BoardDoAuthorizableService, CardService, ContentElementService } from '../service';

@Injectable()
export class CardUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly boardDoAuthorizableService: BoardDoAuthorizableService,
		private readonly cardService: CardService,
		private readonly elementService: ContentElementService,
		private readonly logger: LegacyLogger,
		private readonly httpService: HttpService
	) {
		this.logger.setContext(CardUc.name);
	}

	async findCards(userId: EntityId, cardIds: EntityId[]): Promise<Card[]> {
		this.logger.debug({ action: 'findCards', userId, cardIds });

		const cards = await this.cardService.findByIds(cardIds);
		const allowedCards = await this.filterAllowed(userId, cards, Action.read);

		return allowedCards;
	}

	// --- elements ---

	async createElement(
		userId: EntityId,
		cardId: EntityId,
		type: ContentElementType,
		toPosition?: number
	): Promise<FileElement | RichTextElement | DrawingElement | SubmissionContainerElement> {
		this.logger.debug({ action: 'createElement', userId, cardId, type });

		const card = await this.cardService.findById(cardId);
		await this.checkPermission(userId, card, Action.write);

		const element = await this.elementService.create(card, type);
		if (toPosition !== undefined && typeof toPosition === 'number') {
			await this.elementService.move(element, card, toPosition);
		}

		return element;
	}

	async deleteElement(userId: EntityId, elementId: EntityId, auth: string): Promise<void> {
		this.logger.debug({ action: 'deleteElement', userId, elementId });

		const element = await this.elementService.findById(elementId);
		await this.checkPermission(userId, element, Action.write);
		await this.elementService.delete(element);
		if (element instanceof DrawingElement) {
			try {
				await firstValueFrom(
					this.httpService.delete(
						`${Configuration.get('TLDRAW_URI') as string}/api/v3/tldraw-document/${element.drawingName}`,
						{
							headers: {
								Accept: 'Application/json',
								Authorization: auth,
							},
						}
					)
				);
			} catch (e) {
				const urlTldraw = Configuration.get('TLDRAW_URI') as string;
				throw new Error(urlTldraw);
			}
		}
	}

	async moveElement(
		userId: EntityId,
		elementId: EntityId,
		targetCardId: EntityId,
		targetPosition: number
	): Promise<void> {
		this.logger.debug({ action: 'moveCard', userId, elementId, targetCardId, targetPosition });

		const element = await this.elementService.findById(elementId);
		const targetCard = await this.cardService.findById(targetCardId);

		await this.checkPermission(userId, element, Action.write);
		await this.checkPermission(userId, targetCard, Action.write);

		await this.elementService.move(element, targetCard, targetPosition);
	}

	private async checkPermission(userId: EntityId, boardDo: AnyBoardDo, action: Action): Promise<void> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardDoAuthorizable = await this.boardDoAuthorizableService.getBoardAuthorizable(boardDo);
		const context = { action, requiredPermissions: [] };

		return this.authorizationService.checkPermission(user, boardDoAuthorizable, context);
	}

	private async filterAllowed<T extends AnyBoardDo>(userId: EntityId, boardDos: T[], action: Action): Promise<T[]> {
		const user = await this.authorizationService.getUserWithPermissions(userId);

		const context = { action, requiredPermissions: [] };
		const promises = boardDos.map((boardDo) =>
			this.boardDoAuthorizableService.getBoardAuthorizable(boardDo).then((boardDoAuthorizable) => {
				return { boardDoAuthorizable, boardDo };
			})
		);
		const result = await Promise.all(promises);

		const allowed = result.reduce((allowedDos: T[], { boardDoAuthorizable, boardDo }) => {
			if (this.authorizationService.hasPermission(user, boardDoAuthorizable, context)) {
				allowedDos.push(boardDo);
			}
			return allowedDos;
		}, []);

		return allowed;
	}
}
