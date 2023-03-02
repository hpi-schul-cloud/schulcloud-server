import { Body, Controller, Get, NotImplementedException, Param, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import {
	BoardColumnUrlParams,
	BoardResponse,
	BoardUrlParams,
	MoveCardBodyParams,
	MoveColumnBodyParams,
	RenameBodyParams,
	TimestampsResponse,
} from './dto';
import { BoardColumnResponse } from './dto/board/board-column.response';
import { BoardSkeletonCardReponse } from './dto/board/board-skeleton-card.response';

@ApiTags('Boards')
@Authenticate('jwt')
@Controller('boards')
export class BoardController {
	@Get(':boardId')
	getBoardSkeleton(
		@Param() urlParams: BoardUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<BoardResponse> {
		const result = new BoardResponse({
			id: 'abcdefg',
			title: 'a mocked testboard, please do not use',
			columns: [
				new BoardColumnResponse({
					id: '0123456789abcdef00000010',
					title: 'first column',
					cards: [
						new BoardSkeletonCardReponse({ cardId: '0123456789abcdef00000001', height: 175 }),
						new BoardSkeletonCardReponse({ cardId: '0123456789abcdef00000002', height: 175 }),
					],
				}),
				new BoardColumnResponse({
					id: '0123456789abcdef00000020',
					title:
						'second column, has a relatively long title that may or may not be a bit challenging to render... maybe do it partially?',
					cards: [new BoardSkeletonCardReponse({ cardId: '0123456789abcdef00000003', height: 175 })],
				}),
				new BoardColumnResponse({
					id: '0123456789abcdef00000030',
					title: 'third column is empty for now',
					cards: [],
				}),
			],
			timestamps: new TimestampsResponse({ lastUpdatedAt: new Date().toString(), createdAt: new Date().toString() }),
		});

		return Promise.resolve(result);
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
