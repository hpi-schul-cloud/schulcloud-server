import { Authenticate, CurrentUser, ICurrentUser } from '@modules/authentication';
import { Controller, ForbiddenException, Get, NotFoundException, Param, Post } from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiCreatedResponse,
	ApiForbiddenResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
} from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common';
import type { MediaBoard, MediaLine } from '@shared/domain/domainobject';
import { MediaBoardUc } from '../../uc';
import type { BoardUrlParams } from '../dto';
import { MediaBoardResponse, MediaLineResponse } from './dto';
import { MediaBoardResponseMapper, MediaLineResponseMapper } from './mapper';

@ApiTags('Media Board')
@Authenticate('jwt')
@Controller('media-boards')
export class MediaBoardController {
	constructor(private readonly mediaBoardUc: MediaBoardUc) {}

	@ApiOperation({ summary: 'Get the media shelf of the user.' })
	@ApiOkResponse({ type: MediaBoardResponse })
	@ApiBadRequestResponse({ type: ApiValidationError })
	@ApiForbiddenResponse({ type: ForbiddenException })
	@Get('me')
	public async getMediaBoardForUser(@CurrentUser() currentUser: ICurrentUser): Promise<MediaBoardResponse> {
		const board: MediaBoard = await this.mediaBoardUc.getMediaBoardForUser(currentUser.userId);

		const response: MediaBoardResponse = MediaBoardResponseMapper.mapToResponse(board);

		return response;
	}

	@ApiOperation({ summary: 'Create a new line on a media board.' })
	@ApiCreatedResponse({ type: MediaLineResponse })
	@ApiBadRequestResponse({ type: ApiValidationError })
	@ApiForbiddenResponse({ type: ForbiddenException })
	@ApiNotFoundResponse({ type: NotFoundException })
	@Post(':boardId/media-lines')
	public async createColumn(
		@Param() urlParams: BoardUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<MediaLineResponse> {
		const line: MediaLine = await this.mediaBoardUc.createLine(currentUser.userId, urlParams.boardId);

		const response: MediaLineResponse = MediaLineResponseMapper.mapToResponse(line);

		return response;
	}
}
