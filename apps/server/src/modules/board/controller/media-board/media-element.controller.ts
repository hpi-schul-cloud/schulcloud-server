import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import {
	Body,
	Controller,
	Delete,
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
import { ApiValidationError } from '@shared/common/error';
import { MediaExternalToolElement } from '../../domain';
import { MediaElementUc } from '../../uc';
import {
	CreateMediaElementBodyParams,
	ElementUrlParams,
	MediaExternalToolElementResponse,
	MoveElementBodyParams,
} from './dto';
import { MediaExternalToolElementResponseMapper } from './mapper';

@ApiTags('Media Element')
@JwtAuthentication()
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
	@ApiCreatedResponse({ type: MediaExternalToolElementResponse })
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

		const response: MediaExternalToolElementResponse =
			MediaExternalToolElementResponseMapper.getInstance().mapToResponse(element);

		return response;
	}

	@ApiOperation({ summary: 'Delete a single element.' })
	@ApiNoContentResponse()
	@ApiBadRequestResponse({ type: ApiValidationError })
	@ApiForbiddenResponse({ type: ForbiddenException })
	@HttpCode(HttpStatus.NO_CONTENT)
	@Delete(':elementId')
	public async deleteElement(
		@Param() urlParams: ElementUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.mediaElementUc.deleteElement(currentUser.userId, urlParams.elementId);
	}
}
