import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { BoardCardType, CardIdsParams, CardListResponse, CardResponse, ContentElementResponse } from './dto';
import { VisibilitySettingsResponse } from './dto/card/visibility-settings.response';

@ApiTags('Cards')
@Authenticate('jwt')
@Controller('cards')
export class CardsController {
	@Get()
	getCards(@CurrentUser() currentUser: ICurrentUser, @Query() cardIdParams: CardIdsParams): Promise<CardListResponse> {
		const result = new CardListResponse({
			data: [
				// '[a-f0-9]{24}'
				new CardResponse({
					id: '0123456789abcdef00000001',
					elements: [new ContentElementResponse()],
					cardType: BoardCardType.LEGACY_LESSON,
					visibilitySettings: new VisibilitySettingsResponse({}),
				}),
				new CardResponse({
					id: '0123456789abcdef00000002',
					elements: [new ContentElementResponse(), new ContentElementResponse()],
					cardType: BoardCardType.LEGACY_TASK,
					visibilitySettings: new VisibilitySettingsResponse({}),
				}),
				new CardResponse({
					id: '0123456789abcdef00000003',
					elements: [new ContentElementResponse(), new ContentElementResponse(), new ContentElementResponse()],
					cardType: BoardCardType.LEGACY_TASK,
					visibilitySettings: new VisibilitySettingsResponse({}),
				}),
			],
		});
		return Promise.resolve(result);
	}
}
