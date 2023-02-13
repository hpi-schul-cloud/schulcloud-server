import { Body, Controller, Get, NotImplementedException, Param, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '@shared/domain';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import {
	BoardColumnUrlParams,
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
	@Get(':boardId')
	getBoardSkeleton(
		@Param() urlParams: BoardUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<BoardResponse> {
		throw new NotImplementedException();
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
		@Param() urlParams: BoardColumnUrlParams,
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
		@Param() urlParams: BoardColumnUrlParams,
		@Body() bodyParams: RenameBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		throw new NotImplementedException();
	}
}
