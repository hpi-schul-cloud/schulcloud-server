import { Authenticate, CurrentUser, ICurrentUser } from '@modules/authentication';
import {
	Body,
	Controller,
	ForbiddenException,
	HttpCode,
	HttpStatus,
	NotFoundException,
	Param,
	Put,
} from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiForbiddenResponse,
	ApiNoContentResponse,
	ApiNotFoundResponse,
	ApiOperation,
	ApiTags,
} from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common';
import { MediaElementUc } from '../../uc';
import { MoveColumnBodyParams } from '../dto';
import { ElementUrlParams } from './dto';

@ApiTags('Media Element')
@Authenticate('jwt')
@Controller('media-elements')
export class MediaElementController {
	constructor(private readonly mediaElementUc: MediaElementUc) {}

	@ApiOperation({ summary: 'Move a single element.' })
	@ApiNoContentResponse()
	@ApiBadRequestResponse({ type: ApiValidationError })
	@ApiForbiddenResponse({ type: ForbiddenException })
	@ApiNotFoundResponse({ type: NotFoundException })
	@HttpCode(HttpStatus.NO_CONTENT)
	@Put(':elementId/position')
	public async moveElement(
		@Param() urlParams: ElementUrlParams,
		@Body() bodyParams: MoveColumnBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.mediaElementUc.moveElement(
			currentUser.userId,
			urlParams.elementId,
			bodyParams.toBoardId,
			bodyParams.toPosition
		);
	}
}
