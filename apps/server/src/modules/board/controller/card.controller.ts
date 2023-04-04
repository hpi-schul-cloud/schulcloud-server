import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { CardUc } from '../uc/card.uc';
import { CardIdsParams, CardIdUrlParams, CardListResponse, ContentElementUrlParams, TextElementResponse } from './dto';
import { AnyContentElementResponse } from './dto/card/any-content-element.response';
import { MoveContentElementBody } from './dto/card/move-content-element.body.params';
import { TextElementResponseMapper } from './mapper';
import { CardResponseMapper } from './mapper/card-response.mapper';

@ApiTags('Cards')
@Authenticate('jwt')
@Controller('cards')
export class CardController {
	constructor(private readonly cardUc: CardUc) {}

	@Get()
	async getCards(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() cardIdParams: CardIdsParams
	): Promise<CardListResponse> {
		const cardIds = Array.isArray(cardIdParams.ids) ? cardIdParams.ids : [cardIdParams.ids];
		const cards = await this.cardUc.findCards(currentUser.userId, cardIds);
		const cardResponses = cards.map((card) => CardResponseMapper.mapToResponse(card));

		const result = new CardListResponse({
			data: cardResponses,
		});
		return result;
	}

	@ApiExtraModels(TextElementResponse)
	@ApiResponse({
		status: 201,
		schema: {
			oneOf: [{ $ref: getSchemaPath(TextElementResponse) }],
		},
	})
	@Post(':cardId/elements')
	async createElement(
		@Param() urlParams: CardIdUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<AnyContentElementResponse> {
		const element = await this.cardUc.createElement(currentUser.userId, urlParams.cardId);

		const response = TextElementResponseMapper.mapToResponse(element);

		return response;
	}

	@Delete(':cardId/elements/:contentElementId')
	async deleteElement(
		@Param() urlParams: ContentElementUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<boolean> {
		await this.cardUc.deleteElement(currentUser.userId, urlParams.cardId, urlParams.contentElementId);

		return true;
	}

	@Put(':cardId/elements/:contentElementId/position')
	async moveColumn(
		@Param() urlParams: ContentElementUrlParams,
		@Body() bodyParams: MoveContentElementBody,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<boolean> {
		await this.cardUc.moveElement(
			currentUser.userId,
			urlParams.contentElementId,
			bodyParams.toCardId,
			bodyParams.toIndex
		);
		return true;
	}
}
