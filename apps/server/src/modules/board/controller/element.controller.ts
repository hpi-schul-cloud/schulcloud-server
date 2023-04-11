import { Body, Controller, Delete, Param, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { CardUc } from '../uc/card.uc';
import { ContentElementUrlParams } from './dto';
import { MoveContentElementBody } from './dto/card/move-content-element.body.params';

@ApiTags('Board Element')
@Authenticate('jwt')
@Controller('elements')
export class ElementController {
	constructor(private readonly cardUc: CardUc) {}

	@Put(':contentElementId/position')
	async moveElement(
		@Param() urlParams: ContentElementUrlParams,
		@Body() bodyParams: MoveContentElementBody,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<boolean> {
		await this.cardUc.moveElement(
			currentUser.userId,
			urlParams.contentElementId,
			bodyParams.toCardId,
			bodyParams.toPosition
		);
		return true;
	}

	// @Put(:contentElementId)
	// async UpdateElement(): Promise<boolean> {
	// 	return true;
	// }

	@Delete(':contentElementId')
	async deleteElement(
		@Param() urlParams: ContentElementUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<boolean> {
		await this.cardUc.deleteElement(currentUser.userId, urlParams.contentElementId);

		return true;
	}
}
