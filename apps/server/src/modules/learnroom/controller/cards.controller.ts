import { Controller, Get, NotImplementedException, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '@shared/domain';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { CardIdsParams } from './dto';

export class CardListResponse {}

@ApiTags('Cards')
@Authenticate('jwt')
@Controller('cards')
export class CardsController {
	@Get()
	getCards(@CurrentUser() currentUser: ICurrentUser, @Query() cardIdParams: CardIdsParams): Promise<CardListResponse> {
		throw new NotImplementedException();
	}
}
