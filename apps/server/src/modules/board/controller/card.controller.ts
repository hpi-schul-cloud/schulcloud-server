import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { CardUc } from '../uc/card.uc';
import { CardIdsParams, CardListResponse, CardUrlParams, TextElementResponse } from './dto';
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

	@Post(':cardId/elements')
	async createElement(
		@Param() urlParams: CardUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<TextElementResponse> {
		const element = await this.cardUc.createElement(currentUser.userId, urlParams.cardId);

		const response = TextElementResponseMapper.mapToResponse(element);

		return response;
	}
}
