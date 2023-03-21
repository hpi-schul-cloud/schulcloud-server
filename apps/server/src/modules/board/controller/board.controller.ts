import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { BoardUc, CardUc } from '../uc';
import { BoardResponse, BoardUrlParams, CardResponse, ColumnResponse, ColumnUrlParams } from './dto';
import { BoardResponseMapper, CardResponseMapper, ColumnResponseMapper } from './mapper';

@ApiTags('Boards')
@Authenticate('jwt')
@Controller('boards')
export class BoardController {
	constructor(private readonly boardUc: BoardUc, private readonly cardUc: CardUc) {}

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

	@Post(':boardId/columns')
	async createColumn(
		@Param() urlParams: BoardUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<ColumnResponse> {
		const column = await this.boardUc.createColumn(currentUser.userId, urlParams.boardId);

		const response = ColumnResponseMapper.mapToResponse(column);

		return response;
	}

	@Post(':boardId/columns/:columnId/cards')
	async createCard(
		@Param() urlParams: ColumnUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<CardResponse> {
		const card = await this.cardUc.createCard(currentUser.userId, urlParams.boardId, urlParams.columnId);

		const response = CardResponseMapper.mapToResponse(card);

		return response;
	}

	// @Put('/:boardId/cards/:cardId/position')
	// moveCard(
	// 	@Param() urlParams: BoardUrlParams,
	// 	@Body() bodyParams: MoveCardBodyParams,
	// 	@CurrentUser() currentUser: ICurrentUser
	// ): Promise<void> {
	// 	throw new NotImplementedException();
	// }

	// @Put('/:boardId/columns/:columnId/position')
	// moveColumn(
	// 	@Param() urlParams: ColumnUrlParams,
	// 	@Body() bodyParams: MoveColumnBodyParams,
	// 	@CurrentUser() currentUser: ICurrentUser
	// ): Promise<void> {
	// 	throw new NotImplementedException();
	// }

	// @Put('/:boardId/title')
	// renameBoard(
	// 	@Param() urlParams: BoardUrlParams,
	// 	@Body() bodyParams: RenameBodyParams,
	// 	@CurrentUser() currentUser: ICurrentUser
	// ): Promise<void> {
	// 	throw new NotImplementedException();
	// }

	// @Put(':boardId/columns/:columnId/title')
	// renameColumn(
	// 	@Param() urlParams: ColumnUrlParams,
	// 	@Body() bodyParams: RenameBodyParams,
	// 	@CurrentUser() currentUser: ICurrentUser
	// ): Promise<void> {
	// 	throw new NotImplementedException();
	// }
}
