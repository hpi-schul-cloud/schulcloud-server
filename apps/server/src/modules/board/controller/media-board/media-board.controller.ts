import { Authenticate, CurrentUser, ICurrentUser } from '@modules/authentication';
import {
	Body,
	Controller,
	ForbiddenException,
	Get,
	HttpCode,
	HttpStatus,
	NotFoundException,
	Param,
	Patch,
	Post,
} from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiCreatedResponse,
	ApiForbiddenResponse,
	ApiNoContentResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
} from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common';
import { MediaAvailableLine, MediaBoard, MediaLine } from '../../domain';
import { MediaAvailableLineUc, MediaBoardUc } from '../../uc';
import { BoardUrlParams } from '../dto';
import {
	CollapsableBodyParams,
	ColorBodyParams,
	LayoutBodyParams,
	MediaAvailableLineResponse,
	MediaBoardResponse,
	MediaLineResponse,
} from './dto';
import { MediaAvailableLineResponseMapper, MediaBoardResponseMapper, MediaLineResponseMapper } from './mapper';

@ApiTags('Media Board')
@Authenticate('jwt')
@Controller('media-boards')
export class MediaBoardController {
	constructor(
		private readonly mediaBoardUc: MediaBoardUc,
		private readonly mediaAvailableLineUc: MediaAvailableLineUc
	) {}

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
	public async createLine(
		@Param() urlParams: BoardUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<MediaLineResponse> {
		const line: MediaLine = await this.mediaBoardUc.createLine(currentUser.userId, urlParams.boardId);

		const response: MediaLineResponse = MediaLineResponseMapper.mapToResponse(line);

		return response;
	}

	@ApiOperation({ summary: 'Get the media available line for the board.' })
	@ApiOkResponse({ type: MediaAvailableLineResponse })
	@ApiForbiddenResponse({ type: ForbiddenException })
	@Get(':boardId/media-available-line')
	public async getMediaAvailableLine(
		@Param() urlParams: BoardUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<MediaAvailableLineResponse> {
		const mediaAvailableLine: MediaAvailableLine = await this.mediaAvailableLineUc.getMediaAvailableLine(
			currentUser.userId,
			urlParams.boardId
		);

		const response: MediaAvailableLineResponse = MediaAvailableLineResponseMapper.mapToResponse(mediaAvailableLine);

		return response;
	}

	@ApiOperation({ summary: 'Update the color of available line in media board.' })
	@ApiNoContentResponse()
	@ApiBadRequestResponse({ type: ApiValidationError })
	@ApiForbiddenResponse({ type: ForbiddenException })
	@ApiNotFoundResponse({ type: NotFoundException })
	@HttpCode(HttpStatus.NO_CONTENT)
	@Patch(':boardId/media-available-line/color')
	public async updateMediaAvailableLineColor(
		@Param() urlParams: BoardUrlParams,
		@Body() bodyParams: ColorBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.mediaAvailableLineUc.updateAvailableLineColor(
			currentUser.userId,
			urlParams.boardId,
			bodyParams.backgroundColor
		);
	}

	@ApiOperation({ summary: 'Collapse available line in media board.' })
	@ApiNoContentResponse()
	@ApiBadRequestResponse({ type: ApiValidationError })
	@ApiForbiddenResponse({ type: ForbiddenException })
	@ApiNotFoundResponse({ type: NotFoundException })
	@HttpCode(HttpStatus.NO_CONTENT)
	@Patch(':boardId/media-available-line/collapse')
	public async collapseMediaAvailableLine(
		@Param() urlParams: BoardUrlParams,
		@Body() bodyParams: CollapsableBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.mediaAvailableLineUc.collapseAvailableLine(currentUser.userId, urlParams.boardId, bodyParams.collapsed);
	}

	@ApiOperation({ summary: 'Set layout for media board.' })
	@ApiNoContentResponse()
	@ApiBadRequestResponse({ type: ApiValidationError })
	@ApiForbiddenResponse({ type: ForbiddenException })
	@ApiNotFoundResponse({ type: NotFoundException })
	@HttpCode(HttpStatus.NO_CONTENT)
	@Patch(':boardId/layout')
	public async setMediaBoardLayout(
		@Param() urlParams: BoardUrlParams,
		@Body() bodyParams: LayoutBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.mediaBoardUc.setLayout(currentUser.userId, urlParams.boardId, bodyParams.layout);
	}
}
