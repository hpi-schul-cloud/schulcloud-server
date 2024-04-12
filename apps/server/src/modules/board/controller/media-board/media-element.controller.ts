import { Authenticate, CurrentUser, ICurrentUser } from '@modules/authentication';
import {
	Body,
	Controller,
	ForbiddenException,
	HttpCode,
	HttpStatus,
	NotFoundException,
	Param,
	Post,
	Put,
} from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiCreatedResponse,
	ApiForbiddenResponse,
	ApiNoContentResponse,
	ApiNotFoundResponse,
	ApiOperation,
	ApiTags,
} from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common';
import { MediaExternalToolElement } from '@shared/domain/domainobject';
import { MediaElementUc } from '../../uc';
import {
	CreateMediaElementBodyParams,
	ElementUrlParams,
	MediaExternalToolElementResponse,
	MoveElementBodyParams,
} from './dto';
import { MediaExternalToolElementResponseMapper } from './mapper';

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
		@Body() bodyParams: MoveElementBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.mediaElementUc.moveElement(
			currentUser.userId,
			urlParams.elementId,
			bodyParams.toLineId,
			bodyParams.toPosition
		);
	}

	@ApiOperation({ summary: 'Create a new element.' })
	@ApiCreatedResponse()
	@ApiBadRequestResponse({ type: ApiValidationError })
	@ApiForbiddenResponse({ type: ForbiddenException })
	@Post()
	public async createElement(
		@Body() params: CreateMediaElementBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<MediaExternalToolElementResponse> {
		const element: MediaExternalToolElement = await this.mediaElementUc.createElement(
			currentUser.userId,
			params.schoolExternalToolId,
			params.lineId,
			params.position
		);

		const response: MediaExternalToolElementResponse = MediaExternalToolElementResponseMapper.mapToResponse(element);

		return response;
	}
}
