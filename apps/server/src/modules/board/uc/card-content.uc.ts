import { LegacyLogger } from '@core/logger';
import { Injectable } from '@nestjs/common';
import {
	AnyContentElement,
	BoardNodeFactory,
	CollaborativeTextEditorElement,
	Column,
	ContentElementType,
	DeletedElement,
	DrawingElement,
	ExternalToolElement,
	FileElement,
	LinkElement,
	RichTextElement,
	SubmissionContainerElement,
} from '../domain';
import { EntityId } from '@shared/domain/types';
import { BoardNodePermissionService, BoardNodeService } from '../service';
import { Action } from '@modules/authorization';
import { CardImportParams } from '../controller/dto/card/card-import.params';
import { CardElementParams } from '../controller/dto/card/card-element.params';
import { CardResponseMapper } from '../controller/mapper';
import { CardImportResponse } from '../controller/dto/card/card-import.response';

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
	): Promise<CardImportResponse> {
		this.logger.debug({ action: 'createCardWithContent', userId, columnId });
		const column = await this.boardNodeService.findByClassAndId(Column, columnId);

		await this.boardNodePermissionService.checkPermission(userId, column, Action.write);

		const elements = requiredEmptyElements.map((type) => this.boardNodeFactory.buildContentElement(type));
		const card = this.boardNodeFactory.buildCard(elements);
		await this.boardNodeService.addToParent(column, card);

		return {
			cardResponse: CardResponseMapper.mapToResponse(card),
			cardImportParams: this.createCardImportParams(card.id, elements),
		};
	}

	private createCardImportParams(cardId: string, elements: AnyContentElement[]): CardImportParams {
		return new CardImportParams(cardId, this.createCardElementParams(cardId, elements));
	}

	private createCardElementParams(cardId: string, elements: AnyContentElement[]): CardElementParams[] {
		let position = 0;
		return elements.map(
			(element) =>
				new CardElementParams(
					cardId,
					this.determineContentElementType(element),
					element,
					position === 0 ? position : ++position
				)
		);
	}

	private determineContentElementType(element: AnyContentElement): ContentElementType {
		if (element instanceof ExternalToolElement) {
			return ContentElementType.EXTERNAL_TOOL;
		} else if (element instanceof FileElement) {
			return ContentElementType.FILE;
		} else if (element instanceof LinkElement) {
			return ContentElementType.LINK;
		} else if (element instanceof RichTextElement) {
			return ContentElementType.RICH_TEXT;
		} else if (element instanceof SubmissionContainerElement) {
			return ContentElementType.SUBMISSION_CONTAINER;
		} else if (element instanceof DrawingElement) {
			return ContentElementType.DRAWING;
		} else if (element instanceof CollaborativeTextEditorElement) {
			return ContentElementType.COLLABORATIVE_TEXT_EDITOR;
		} else if (element instanceof DeletedElement) {
			return ContentElementType.DELETED;
		} else {
			throw new Error('Unknown content element type');
		}
	}
}
