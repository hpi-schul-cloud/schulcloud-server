import { Authenticate, CurrentUser, ICurrentUser } from '@modules/authentication';
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
import { ApiValidationError, RequestTimeout } from '@shared/common';
import { CopyApiResponse, CopyMapper } from '@modules/copy-helper';
import { BoardUc } from '../uc';
import {
	BoardResponse,
	BoardUrlParams,
	ColumnResponse,
	CreateBoardBodyParams,
	CreateBoardResponse,
	UpdateBoardTitleParams,
	VisibilityBodyParams,
} from './dto';
import { BoardContextResponse } from './dto/board/board-context.reponse';
import { BoardResponseMapper, ColumnResponseMapper, CreateBoardResponseMapper } from './mapper';

@ApiTags('Board')
@Authenticate('jwt')
@Controller('boards')
export class BoardController {
	constructor(private readonly boardUc: BoardUc) {}

	@ApiOperation({ summary: 'Create a new board.' })
	@ApiResponse({ status: 201, type: CreateBoardResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@Post()
	async createBoard(
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
	async getBoardSkeleton(
		@Param() urlParams: BoardUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<BoardResponse> {
		const board = await this.boardUc.findBoard(currentUser.userId, urlParams.boardId);

		const response = BoardResponseMapper.mapToResponse(board);

		return response;
	}

	@ApiOperation({ summary: 'Get the context of a board.' })
	@ApiResponse({ status: 200, type: BoardContextResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@Get(':boardId/context')
	async getBoardContext(
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
	async updateBoardTitle(
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
	async deleteBoard(@Param() urlParams: BoardUrlParams, @CurrentUser() currentUser: ICurrentUser): Promise<void> {
		await this.boardUc.deleteBoard(currentUser.userId, urlParams.boardId);
	}

	@ApiOperation({ summary: 'Create a new column on a board.' })
	@ApiResponse({ status: 201, type: ColumnResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@Post(':boardId/columns')
	async createColumn(
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
	@RequestTimeout('INCOMING_REQUEST_TIMEOUT_COPY_API')
	async copyBoard(
		@Param() urlParams: BoardUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<CopyApiResponse> {
		const copyStatus = await this.boardUc.copyBoard(currentUser.userId, urlParams.boardId);
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
	async updateVisibility(
		@Param() urlParams: BoardUrlParams,
		@Body() bodyParams: VisibilityBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	) {
		await this.boardUc.updateVisibility(currentUser.userId, urlParams.boardId, bodyParams.isVisible);
	}
}
