import { Body, Controller, Delete, ForbiddenException, HttpCode, NotFoundException, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ApiValidationError } from '@shared/common';
import { CardUc } from '../uc';
import { ContentElementUrlParams, MoveContentElementBody } from './dto';

@ApiTags('Board Element')
@Authenticate('jwt')
@Controller('elements')
export class ElementController {
	constructor(private readonly cardUc: CardUc) {}

	@ApiOperation({ summary: 'Move a single content element.' })
	@ApiResponse({ status: 204 })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@HttpCode(204)
	@Put(':contentElementId/position')
	async moveElement(
		@Param() urlParams: ContentElementUrlParams,
		@Body() bodyParams: MoveContentElementBody,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.cardUc.moveElement(
			currentUser.userId,
			urlParams.contentElementId,
			bodyParams.toCardId,
			bodyParams.toPosition
		);
	}

	@ApiOperation({ summary: 'Delete a single content element.' })
	@ApiResponse({ status: 204 })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@HttpCode(204)
	@Delete(':contentElementId')
	async deleteElement(
		@Param() urlParams: ContentElementUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.cardUc.deleteElement(currentUser.userId, urlParams.contentElementId);
	}
}
