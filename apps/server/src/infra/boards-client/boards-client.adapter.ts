import { Injectable } from '@nestjs/common';
import { BoardApi, CreateBoardBodyParams, CreateBoardResponse } from './generated';

@Injectable()
export class BoardsClientAdapter {
	constructor(private readonly boardApi: BoardApi) {}

	public async createBoard(params: CreateBoardBodyParams): Promise<CreateBoardResponse | null> {
		const response = await this.boardApi.boardControllerCreateBoard(params);

		return response.data;
	}
}
