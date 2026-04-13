import { Injectable } from '@nestjs/common';
import { BoardApi, BoardResponse, ColumnResponse, CreateBoardBodyParams, CreateBoardResponse } from '../generated';
import { AdapterUtils } from './adapter.utils';

@Injectable()
export class BoardsClientAdapter {
	constructor(private readonly boardApi: BoardApi) {}

	public async createBoard(jwt: string, params: CreateBoardBodyParams): Promise<CreateBoardResponse> {
		const response = await AdapterUtils.retry(() =>
			this.boardApi.boardControllerCreateBoard(params, AdapterUtils.createAxiosConfigForJwt(jwt))
		);

		return response.data;
	}

	public async createBoardColumn(jwt: string, boardId: string): Promise<ColumnResponse> {
		const response = await AdapterUtils.retry(() =>
			this.boardApi.boardControllerCreateColumn(boardId, AdapterUtils.createAxiosConfigForJwt(jwt))
		);

		return response.data;
	}

	public async getBoardSkeletonById(jwt: string, boardId: string): Promise<BoardResponse> {
		const response = await this.boardApi.boardControllerGetBoardSkeleton(
			boardId,
			AdapterUtils.createAxiosConfigForJwt(jwt)
		);

		return response.data;
	}
}
