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
	Patch,
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
import { MediaLineUc } from '../../uc';
import { MoveColumnBodyParams, RenameBodyParams } from '../dto';
import { CollapsableBodyParams, ColorBodyParams, LineUrlParams } from './dto';

@ApiTags('Media Line')
@JwtAuthentication()
@Controller('media-lines')
export class MediaLineController {
	constructor(private readonly mediaLineUc: MediaLineUc) {}

	@ApiOperation({ summary: 'Move a single line.' })
	@ApiNoContentResponse()
	@ApiBadRequestResponse({ type: ApiValidationError })
	@ApiForbiddenResponse({ type: ForbiddenException })
	@ApiNotFoundResponse({ type: NotFoundException })
	@HttpCode(HttpStatus.NO_CONTENT)
	@Put(':lineId/position')
	public async moveLine(
		@Param() urlParams: LineUrlParams,
		@Body() bodyParams: MoveColumnBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.mediaLineUc.moveLine(currentUser.userId, urlParams.lineId, bodyParams.toBoardId, bodyParams.toPosition);
	}

	@ApiOperation({ summary: 'Update the title of a single line.' })
	@ApiNoContentResponse()
	@ApiBadRequestResponse({ type: ApiValidationError })
	@ApiForbiddenResponse({ type: ForbiddenException })
	@ApiNotFoundResponse({ type: NotFoundException })
	@HttpCode(HttpStatus.NO_CONTENT)
	@Patch(':lineId/title')
	public async updateLineTitle(
		@Param() urlParams: LineUrlParams,
		@Body() bodyParams: RenameBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.mediaLineUc.updateLineTitle(currentUser.userId, urlParams.lineId, bodyParams.title);
	}

	@ApiOperation({ summary: 'Update the color of a single line.' })
	@ApiNoContentResponse()
	@ApiBadRequestResponse({ type: ApiValidationError })
	@ApiForbiddenResponse({ type: ForbiddenException })
	@ApiNotFoundResponse({ type: NotFoundException })
	@HttpCode(HttpStatus.NO_CONTENT)
	@Patch(':lineId/color')
	public async updateBackgroundColor(
		@Param() urlParams: LineUrlParams,
		@Body() bodyParams: ColorBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.mediaLineUc.updateLineColor(currentUser.userId, urlParams.lineId, bodyParams.backgroundColor);
	}

	@ApiOperation({ summary: 'Collapse available line in media board.' })
	@ApiNoContentResponse()
	@ApiBadRequestResponse({ type: ApiValidationError })
	@ApiForbiddenResponse({ type: ForbiddenException })
	@ApiNotFoundResponse({ type: NotFoundException })
	@HttpCode(HttpStatus.NO_CONTENT)
	@Patch(':lineId/collapse')
	public async collapseMediaLine(
		@Param() urlParams: LineUrlParams,
		@Body() bodyParams: CollapsableBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.mediaLineUc.collapseLine(currentUser.userId, urlParams.lineId, bodyParams.collapsed);
	}

	@ApiOperation({ summary: 'Delete a single line.' })
	@ApiNoContentResponse()
	@ApiBadRequestResponse({ type: ApiValidationError })
	@ApiForbiddenResponse({ type: ForbiddenException })
	@ApiNotFoundResponse({ type: NotFoundException })
	@HttpCode(HttpStatus.NO_CONTENT)
	@Delete(':lineId')
	async deleteLine(@Param() urlParams: LineUrlParams, @CurrentUser() currentUser: ICurrentUser): Promise<void> {
		await this.mediaLineUc.deleteLine(currentUser.userId, urlParams.lineId);
	}
}
