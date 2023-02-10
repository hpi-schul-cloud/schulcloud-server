import { Controller, Get, NotImplementedException, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '@shared/domain';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { BoardResponse, BoardUrlParams } from './dto';

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

	/* // GET - Load a Board
// /boards/:id
interface Board {
	id: string;
	title: string;
	columns: BoardColumn[];
	version: number;
	timestamps: BoardTimestamps;
}

interface BoardTimestamps {
	lastUpdatedAt: string;
	createdAt: string;
	deletedAt: string;
}

interface BoardColumn {
	id: string;
	title: string;
	cards: BoardSkeletonCard[];
}

interface BoardSkeletonCard {
	id: string;
	height: number;
} */
}
