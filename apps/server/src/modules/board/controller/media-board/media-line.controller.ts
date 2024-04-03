import { Authenticate, CurrentUser, ICurrentUser } from '@modules/authentication';
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
import type { MoveColumnBodyParams, RenameBodyParams } from '../dto';
import type { LineUrlParams } from './dto';

@ApiTags('Media Line')
@Authenticate('jwt')
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
	public async updateColumnTitle(
		@Param() urlParams: LineUrlParams,
		@Body() bodyParams: RenameBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.mediaLineUc.updateLineTitle(currentUser.userId, urlParams.lineId, bodyParams.title);
	}

	@ApiOperation({ summary: 'Delete a single line.' })
	@ApiNoContentResponse()
	@ApiBadRequestResponse({ type: ApiValidationError })
	@ApiForbiddenResponse({ type: ForbiddenException })
	@ApiNotFoundResponse({ type: NotFoundException })
	@HttpCode(HttpStatus.NO_CONTENT)
	@Delete(':lineId')
	async deleteCard(@Param() urlParams: LineUrlParams, @CurrentUser() currentUser: ICurrentUser): Promise<void> {
		await this.mediaLineUc.deleteLine(currentUser.userId, urlParams.lineId);
	}
}
