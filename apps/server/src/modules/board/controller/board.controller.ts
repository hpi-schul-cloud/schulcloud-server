import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { CopyApiResponse, CopyMapper } from '@modules/copy-helper';
import {
	Body,
	Controller,
	Delete,
	ForbiddenException,
	Get,
	HttpCode,
	NotFoundException,
	Param,
	Patch,
	Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequestTimeout } from '@shared/common/decorators';
import { ApiValidationError } from '@shared/common/error';
import { BOARD_INCOMING_REQUEST_TIMEOUT_COPY_API_KEY } from '../timeout.config';
import { BoardUc } from '../uc';
import {
	BoardResponse,
	BoardUrlParams,
	ColumnResponse,
	CreateBoardBodyParams,
	CreateBoardResponse,
	LayoutBodyParams,
	UpdateBoardTitleParams,
	VisibilityBodyParams,
} from './dto';
import { BoardContextResponse } from './dto/board/board-context.reponse';
import { ReadersCanEditBodyParams } from './dto/board/readers-can-edit.body.params';
import { BoardResponseMapper, ColumnResponseMapper, CreateBoardResponseMapper } from './mapper';

@ApiTags('Board')
@JwtAuthentication()
@Controller('boards')
export class BoardController {
	constructor(private readonly boardUc: BoardUc) {}

	@ApiOperation({ summary: 'Create a new board.' })
	@ApiResponse({ status: 201, type: CreateBoardResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@Post()
	public async createBoard(
		@Body() bodyParams: CreateBoardBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<CreateBoardResponse> {
		const board = await this.boardUc.createBoard(currentUser.userId, bodyParams);

		const response = CreateBoardResponseMapper.mapToResponse(board);

		return response;
	}

	@ApiOperation({ summary: 'Get the skeleton of a a board.' })
	@ApiResponse({ status: 200, type: BoardResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@Get(':boardId')
	public async getBoardSkeleton(
		@Param() urlParams: BoardUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<BoardResponse> {
		const { board, features, permissions } = await this.boardUc.findBoard(currentUser.userId, urlParams.boardId);

		const response = BoardResponseMapper.mapToResponse(board, features, permissions);

		return response;
	}

	@ApiOperation({ summary: 'Get the context of a board.' })
	@ApiResponse({ status: 200, type: BoardContextResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@Get(':boardId/context')
	public async getBoardContext(
		@Param() urlParams: BoardUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<BoardContextResponse> {
		const boardContext = await this.boardUc.findBoardContext(currentUser.userId, urlParams.boardId);

		const response = new BoardContextResponse(boardContext);

		return response;
	}

	@ApiOperation({ summary: 'Update the title of a board.' })
	@ApiResponse({ status: 204 })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@HttpCode(204)
	@Patch(':boardId/title')
	public async updateBoardTitle(
		@Param() urlParams: BoardUrlParams,
		@Body() bodyParams: UpdateBoardTitleParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.boardUc.updateBoardTitle(currentUser.userId, urlParams.boardId, bodyParams.title);
	}

	@ApiOperation({ summary: 'Delete a board.' })
	@ApiResponse({ status: 204 })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@HttpCode(204)
	@Delete(':boardId')
	public async deleteBoard(
		@Param() urlParams: BoardUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.boardUc.deleteBoard(currentUser.userId, urlParams.boardId);
	}

	@ApiOperation({ summary: 'Create a new column on a board.' })
	@ApiResponse({ status: 201, type: ColumnResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@Post(':boardId/columns')
	public async createColumn(
		@Param() urlParams: BoardUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<ColumnResponse> {
		const column = await this.boardUc.createColumn(currentUser.userId, urlParams.boardId);

		const response = ColumnResponseMapper.mapToResponse(column);

		return response;
	}

	@ApiOperation({ summary: 'Create a board copy.' })
	@ApiResponse({ status: 201, type: CopyApiResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@Post(':boardId/copy')
	@RequestTimeout(BOARD_INCOMING_REQUEST_TIMEOUT_COPY_API_KEY)
	public async copyBoard(
		@Param() urlParams: BoardUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<CopyApiResponse> {
		const copyStatus = await this.boardUc.copyBoard(currentUser.userId, urlParams.boardId, currentUser.schoolId);
		const dto = CopyMapper.mapToResponse(copyStatus);
		return dto;
	}

	@ApiOperation({ summary: 'Update the visibility of a board.' })
	@ApiResponse({ status: 204 })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@HttpCode(204)
	@Patch(':boardId/visibility')
	public async updateVisibility(
		@Param() urlParams: BoardUrlParams,
		@Body() bodyParams: VisibilityBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.boardUc.updateVisibility(currentUser.userId, urlParams.boardId, bodyParams.isVisible);
	}

	@ApiOperation({ summary: 'Update the visibility of a board.' })
	@ApiResponse({ status: 204 })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@HttpCode(204)
	@Patch(':boardId/readers-can-edit')
	public async updateReadersCanEdit(
		@Param() urlParams: BoardUrlParams,
		@Body() bodyParams: ReadersCanEditBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.boardUc.updateReadersCanEdit(currentUser.userId, urlParams.boardId, bodyParams.readersCanEdit);
	}

	@ApiOperation({ summary: 'Update the layout of a board.' })
	@ApiResponse({ status: 204 })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@HttpCode(204)
	@Patch(':boardId/layout')
	public async updateLayout(
		@Param() urlParams: BoardUrlParams,
		@Body() bodyParams: LayoutBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.boardUc.updateLayout(currentUser.userId, urlParams.boardId, bodyParams.layout);
	}
}
