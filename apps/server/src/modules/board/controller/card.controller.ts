import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { BoardUc, CardUc } from '../uc';
import {
	AnyContentElementResponse,
	CardIdsParams,
	CardListResponse,
	CardUrlParams,
	ElementsTypeParams,
	MoveCardBodyParams,
	TextElementResponse,
} from './dto';
import { CardResponseMapper, ElementsResponseMapper } from './mapper';

@ApiTags('Board/Cards')
@Authenticate('jwt')
@Controller('cards')
export class CardController {
	constructor(private readonly boardUc: BoardUc, private readonly cardUc: CardUc) {}

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

	@Put(':cardId/position')
	async moveCard(
		@Param() urlParams: CardUrlParams,
		@Body() bodyParams: MoveCardBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<boolean> {
		await this.boardUc.moveCard(currentUser.userId, urlParams.cardId, bodyParams.toColumnId, bodyParams.toPosition);

		return true;
	}

	@Delete(':cardId')
	async deleteCard(@Param() urlParams: CardUrlParams, @CurrentUser() currentUser: ICurrentUser): Promise<boolean> {
		await this.boardUc.deleteCard(currentUser.userId, urlParams.cardId);

		return true;
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
		@Param() urlParams: CardUrlParams, // TODO add type-property ?
		@Body() bodyParams: ElementsTypeParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<AnyContentElementResponse> {
		const { type } = bodyParams;
		const element = await this.cardUc.createElement(currentUser.userId, urlParams.cardId, type);

		return ElementsResponseMapper.mapToResponse(element);
	}
}
