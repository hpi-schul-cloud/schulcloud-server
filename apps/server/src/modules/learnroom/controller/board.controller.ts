import { Body, Controller, Get, NotImplementedException, Param, Patch } from '@nestjs/common';
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

	@Patch('/:boardId/movecard')
	moveCard(
		@Param() urlParams: BoardUrlParams,
		@Body() bodyParams: MoveCardBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		throw new NotImplementedException();
	}

	@Patch('/:boardId/movecolumn')
	moveColumn(
		@Param() urlParams: BoardUrlParams,
		@Body() bodyParams: MoveColumnBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		throw new NotImplementedException();
	}

	@Patch('/:boardId/renameboard')
	renameBoard(
		@Param() urlParams: BoardUrlParams,
		@Body() bodyParams: RenameBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		throw new NotImplementedException();
	}

	@Patch(':boardId/column/:columnId/rename')
	renameColumn(
		@Param() urlParams: BoardColumnUrlParams,
		@Body() bodyParams: RenameBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		throw new NotImplementedException();
	}
}
