import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { BoardUc } from '../uc';
import {
	BoardResponse,
	BoardUrlParams,
	CardResponse,
	CardUrlParams,
	ColumnResponse,
	ColumnUrlParams,
	MoveCardBodyParams,
	MoveColumnBodyParams,
} from './dto';
import { BoardResponseMapper, CardResponseMapper, ColumnResponseMapper } from './mapper';

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

	@Delete(':boardId/columns/:columnId')
	async deleteColumn(@Param() urlParams: ColumnUrlParams, @CurrentUser() currentUser: ICurrentUser): Promise<boolean> {
		await this.boardUc.deleteColumn(currentUser.userId, urlParams.columnId);

		return true;
	}

	@Post(':boardId/columns/:columnId/cards')
	async createCard(
		@Param() urlParams: ColumnUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<CardResponse> {
		const card = await this.boardUc.createCard(currentUser.userId, urlParams.columnId);

		const response = CardResponseMapper.mapToResponse(card);

		return response;
	}

	@Delete(':boardId/columns/:columnId/cards/:cardId')
	async deleteCard(@Param() urlParams: CardUrlParams, @CurrentUser() currentUser: ICurrentUser): Promise<boolean> {
		await this.boardUc.deleteCard(currentUser.userId, urlParams.cardId);

		return true;
	}

	@Put('columns/:columnId/position')
	async moveColumn(
		@Param() urlParams: ColumnUrlParams,
		@Body() bodyParams: MoveColumnBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<boolean> {
		await this.boardUc.moveColumn(currentUser.userId, urlParams.columnId, bodyParams.toBoardId, bodyParams.toPosition);

		return true;
	}

	@Put('cards/:cardId/position')
	async moveCard(
		@Param() urlParams: CardUrlParams,
		@Body() bodyParams: MoveCardBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<boolean> {
		await this.boardUc.moveCard(currentUser.userId, urlParams.cardId, bodyParams.toColumnId, bodyParams.toPosition);

		return true;
	}

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
