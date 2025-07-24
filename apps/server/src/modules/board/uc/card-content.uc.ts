import { LegacyLogger } from '@core/logger';
import { Injectable } from '@nestjs/common';
import { AnyContentElement, BoardNodeFactory, Column, ContentElementType } from '../domain';
import { EntityId } from '@shared/domain/types';
import { BoardNodePermissionService, BoardNodeService } from '../service';
import { Action } from '@modules/authorization';
import { CardResponseMapper } from '../controller/mapper';
import { AnyElementContentBody, CardResponse, UpdateElementContentBodyParams } from '../controller/dto';

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
		const card = this.boardNodeFactory.buildCard(this.convertCardPropsToDomainElements(cardProps));

		await this.boardNodeService.addToParent(column, card);

		const cardResponse = CardResponseMapper.mapToResponse(card);
		cardResponse.title = cardTitle;

		return cardResponse;
	}

	private convertCardPropsToDomainElements(cardProps: UpdateElementContentBodyParams[]): AnyContentElement[] {
		const elementContents = this.convertCardPropsToElements(cardProps);

		return elementContents.map((content) => content as AnyContentElement);
	}

	private convertCardPropsToElements(cardProps: UpdateElementContentBodyParams[]): AnyElementContentBody[] {
		return cardProps.map((param) => {
			const { type, content } = param.data;

			switch (type) {
				case ContentElementType.FILE:
					return {
						caption: content.caption,
						alternativeText: content.alternativeText,
					};
				case ContentElementType.LINK:
					return {
						url: content.url,
						title: content.title,
						description: content.description,
						imageUrl: content.imageUrl,
						originalImageUrl: content.originalImageUrl,
					};
				case ContentElementType.DRAWING:
					return {
						description: content.description,
					};

				case ContentElementType.RICH_TEXT:
					return {
						text: content.text,
						inputFormat: content.inputFormat,
					};

				case ContentElementType.SUBMISSION_CONTAINER:
					return {
						dueDate: content.dueDate,
					};

				case ContentElementType.VIDEO_CONFERENCE:
					return {
						title: content.title,
					};

				case ContentElementType.FILE_FOLDER:
					return {
						title: content.title,
					};

				case ContentElementType.H5P:
					return {
						contentId: content.contentId,
					};

				default:
					throw new Error('Unsupported element type');
			}
		});
	}
}
