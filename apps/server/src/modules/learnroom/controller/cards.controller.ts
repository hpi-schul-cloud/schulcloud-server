import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '@shared/domain';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { CardResponseMapper } from '../mapper/card-response.mapper';
import { CardUc } from '../uc/card.uc';
import { CardIdsParams, CardListResponse } from './dto';

@ApiTags('Cards')
@Authenticate('jwt')
@Controller('cards')
export class CardsController {
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
		return Promise.resolve(result);
	}
}
