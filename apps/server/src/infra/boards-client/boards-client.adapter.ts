import { Injectable } from '@nestjs/common';
import { RawAxiosRequestConfig } from 'axios';
import { BoardApi, BoardResponse, ColumnResponse, CreateBoardBodyParams, CreateBoardResponse } from './generated';

@Injectable()
export class BoardsClientAdapter {
	constructor(private readonly boardApi: BoardApi) {}

	public async createBoard(jwt: string, params: CreateBoardBodyParams): Promise<CreateBoardResponse> {
		const response = await this.boardApi.boardControllerCreateBoard(params, this.getAxiosConfig(jwt));

		return response.data;
	}

	public async createBoardColumn(jwt: string, boardId: string): Promise<ColumnResponse> {
		const response = await this.boardApi.boardControllerCreateColumn(boardId, this.getAxiosConfig(jwt));

		return response.data;
	}

	public async getBoardSkeletonById(jwt: string, boardId: string): Promise<BoardResponse> {
		const response = await this.boardApi.boardControllerGetBoardSkeleton(boardId, this.getAxiosConfig(jwt));

		return response.data;
	}

	private getAxiosConfig(jwt: string): RawAxiosRequestConfig {
		return {
			headers: {
				Authorization: `Bearer ${jwt}`,
			},
		};
	}
}
