import { LegacyLogger } from '@core/logger';
import { Injectable } from '@nestjs/common';
import { AnyContentElement, BoardNodeFactory, Column, ContentElementType } from '../domain';
import { EntityId } from '@shared/domain/types';
import { BoardNodePermissionService, BoardNodeService } from '../service';
import { Action } from '@modules/authorization';
import { CardResponseMapper } from '../controller/mapper';
import {
	CardResponse,
	FileContentBody,
	LinkContentBody,
	RichTextContentBody,
	UpdateElementContentBodyParams,
} from '../controller/dto';

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
		cardProps: UpdateElementContentBodyParams[],
		cardTitle: string
	): Promise<CardResponse> {
		this.logger.debug({ action: 'createCardWithContent', userId, columnId });
		const column = await this.boardNodeService.findByClassAndId(Column, columnId);

		await this.boardNodePermissionService.checkPermission(userId, column, Action.write);
		const card = this.boardNodeFactory.buildCard(this.convertCardPropsToContentElements(cardProps));

		await this.boardNodeService.addToParent(column, card);

		const cardResponse = CardResponseMapper.mapToResponse(card);
		cardResponse.title = cardTitle;

		return cardResponse;
	}

	private convertCardPropsToContentElements(cardProps: UpdateElementContentBodyParams[]): AnyContentElement[] {
		const elementContents: AnyContentElement[] = [];
		for (const cardProp of cardProps) {
			const contentElement = this.boardNodeFactory.buildContentElement(cardProp.data.type);
			elementContents.push(contentElement);
		}
		return elementContents.map((content) => content as AnyContentElement);
	}

	private convertCardPropsToElements(
		cardProps: UpdateElementContentBodyParams[]
	): (RichTextContentBody | LinkContentBody | FileContentBody)[] {
		return cardProps.map((param) => {
			const { type, content } = param.data;

			switch (type) {
				case ContentElementType.LINK:
					return {
						url: content.url,
						title: content.title,
						description: content.description,
						imageUrl: content.imageUrl,
						originalImageUrl: content.originalImageUrl,
					};
				case ContentElementType.RICH_TEXT:
					return {
						text: content.text,
						inputFormat: content.inputFormat,
					};
				case ContentElementType.FILE:
					return {
						caption: content.caption,
						alternativeText: content.alternativeText,
					};
				default:
					throw new Error('Unsupported element type');
			}
		});
	}
}
