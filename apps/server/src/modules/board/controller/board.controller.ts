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
import { ApiValidationError } from '@shared/common';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { BoardUc } from '../uc';
import { BoardResponse, BoardUrlParams, ColumnResponse, RenameBodyParams } from './dto';
import { BoardResponseMapper, ColumnResponseMapper } from './mapper';

@ApiTags('Board')
@Authenticate('jwt')
@Controller('boards')
export class BoardController {
	constructor(private readonly boardUc: BoardUc) {}

	@ApiOperation({ summary: 'Get the skeleton of a a single board.' })
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

	@ApiOperation({ summary: 'Update the title of a single board.' })
	@ApiResponse({ status: 204 })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@HttpCode(204)
	@Patch(':boardId/title')
	async updateBoardTitle(
		@Param() urlParams: BoardUrlParams,
		@Body() bodyParams: RenameBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.boardUc.updateBoardTitle(currentUser.userId, urlParams.boardId, bodyParams.title);
	}

	@ApiOperation({ summary: 'Delete a single board.' })
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
}
