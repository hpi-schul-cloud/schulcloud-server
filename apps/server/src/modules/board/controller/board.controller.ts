import { Body, Controller, Get, NotImplementedException, Param, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { BoardResponseMapper } from './mapper';
import { BoardUc } from '../uc/board.uc';
import {
	ColumnUrlParams,
	BoardResponse,
	BoardUrlParams,
	MoveCardBodyParams,
	MoveColumnBodyParams,
	RenameBodyParams,
} from './dto';

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

	@Put('/:boardId/cards/:cardId/position')
	moveCard(
		@Param() urlParams: BoardUrlParams,
		@Body() bodyParams: MoveCardBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		throw new NotImplementedException();
	}

	@Put('/:boardId/columns/:columnId/position')
	moveColumn(
		@Param() urlParams: ColumnUrlParams,
		@Body() bodyParams: MoveColumnBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		throw new NotImplementedException();
	}

	@Put('/:boardId/title')
	renameBoard(
		@Param() urlParams: BoardUrlParams,
		@Body() bodyParams: RenameBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		throw new NotImplementedException();
	}

	@Put(':boardId/columns/:columnId/title')
	renameColumn(
		@Param() urlParams: ColumnUrlParams,
		@Body() bodyParams: RenameBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		throw new NotImplementedException();
	}
}
