import { LegacyLogger } from '@core/logger';
import { Injectable } from '@nestjs/common';
import {
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
import { CardResponseMapper } from '../controller/mapper';
import { AnyContentElementResponse, CardResponse } from '../controller/dto';

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
	): Promise<CardResponse> {
		this.logger.debug({ action: 'createCardWithContent', userId, columnId });
		const column = await this.boardNodeService.findByClassAndId(Column, columnId);

		await this.boardNodePermissionService.checkPermission(userId, column, Action.write);

		const elements = requiredEmptyElements.map((type) => this.boardNodeFactory.buildContentElement(type));
		const card = this.boardNodeFactory.buildCard(elements);
		await this.boardNodeService.addToParent(column, card);

		const cardResponse = CardResponseMapper.mapToResponse(card);

		return cardResponse;
	}

	public static determineContentElementType(element: AnyContentElementResponse): ContentElementType {
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
