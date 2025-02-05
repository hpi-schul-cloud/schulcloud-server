import { Injectable } from '@nestjs/common';
import {
	BoardApi,
	BoardColumnApi,
	BoardResponse,
	ColumnResponse,
	CreateBoardBodyParams,
	CreateBoardResponse,
	RenameBodyParams,
} from './generated';

@Injectable()
export class BoardsClientAdapter {
	constructor(private readonly boardApi: BoardApi, private readonly columnApi: BoardColumnApi) {}

	public async createBoard(params: CreateBoardBodyParams): Promise<CreateBoardResponse> {
		const response = await this.boardApi.boardControllerCreateBoard(params);

		return response.data;
	}

	public async createBoardColumn(boardId: string): Promise<ColumnResponse> {
		const response = await this.boardApi.boardControllerCreateColumn(boardId);

		return response.data;
	}

	public async getBoardSkeletonById(boardId: string): Promise<BoardResponse> {
		const response = await this.boardApi.boardControllerGetBoardSkeleton(boardId);

		return response.data;
	}

	public async updateBoardColumnTitle(columnId: string, params: RenameBodyParams): Promise<void> {
		await this.columnApi.columnControllerUpdateColumnTitle(columnId, params);
	}
}
