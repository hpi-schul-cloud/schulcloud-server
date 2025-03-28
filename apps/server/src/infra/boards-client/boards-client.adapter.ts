import { Injectable } from '@nestjs/common';
import { BoardApi, BoardResponse, ColumnResponse, CreateBoardBodyParams, CreateBoardResponse } from './generated';

@Injectable()
export class BoardsClientAdapter {
	constructor(private readonly boardApi: BoardApi) {}

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
}
