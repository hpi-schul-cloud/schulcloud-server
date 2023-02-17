import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '@shared/domain';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { CardIdsParams, CardListResponse, CardResponse, ContentElementResponse } from './dto';
import { VisibilitySettingsResponse } from './dto/card/visibility-settings.response';

@ApiTags('Cards')
@Authenticate('jwt')
@Controller('cards')
export class CardsController {
	@Get()
	getCards(@CurrentUser() currentUser: ICurrentUser, @Query() cardIdParams: CardIdsParams): Promise<CardListResponse> {
		const result = new CardListResponse({
			data: [
				new CardResponse({
					id: '1',
					elements: [new ContentElementResponse()],
					cardType: 'content',
					visibilitySettings: new VisibilitySettingsResponse({}),
				}),
				new CardResponse({
					id: '2',
					elements: [new ContentElementResponse(), new ContentElementResponse()],
					cardType: 'content',
					visibilitySettings: new VisibilitySettingsResponse({}),
				}),
				new CardResponse({
					id: '3',
					elements: [new ContentElementResponse(), new ContentElementResponse(), new ContentElementResponse()],
					cardType: 'content',
					visibilitySettings: new VisibilitySettingsResponse({}),
				}),
			],
		});
		return Promise.resolve(result);
	}
}
