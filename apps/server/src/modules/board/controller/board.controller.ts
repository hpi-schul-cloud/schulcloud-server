import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { BoardUc } from '../uc';
import { BoardResponse, BoardUrlParams, ColumnResponse } from './dto';
import { BoardResponseMapper, ColumnResponseMapper } from './mapper';

@ApiTags('Boards')
@Authenticate('jwt')
@Controller('boards')
export class BoardController {
	constructor(private readonly boardUc: BoardUc) {}

	@Get(':boardId')
	async getBoardSkeleton(
		@Param() urlParams: BoardUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<BoardResponse> {
		const board = await this.boardUc.findBoard(currentUser.userId, urlParams.boardId);

		const response = BoardResponseMapper.mapToResponse(board);

		return response;
	}

	@Post()
	async createBoard(@CurrentUser() currentUser: ICurrentUser): Promise<BoardResponse> {
		const board = await this.boardUc.createBoard(currentUser.userId);

		const response = BoardResponseMapper.mapToResponse(board);

		return response;
	}

	// @Put('/:boardId/title')
	// renameBoard(
	// 	@Param() urlParams: BoardUrlParams,
	// 	@Body() bodyParams: RenameBodyParams,
	// 	@CurrentUser() currentUser: ICurrentUser
	// ): Promise<void> {
	// 	throw new NotImplementedException();
	// }

	@Delete(':boardId')
	async deleteBoard(@Param() urlParams: BoardUrlParams, @CurrentUser() currentUser: ICurrentUser): Promise<boolean> {
		await this.boardUc.deleteBoard(currentUser.userId, urlParams.boardId);

		return true;
	}

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
