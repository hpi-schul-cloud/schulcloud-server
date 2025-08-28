import { LegacyLogger } from '@core/logger';
import { Injectable } from '@nestjs/common';
import { BoardApi, BoardResponse, ColumnResponse, CreateBoardBodyParams, CreateBoardResponse } from './generated';

@Injectable()
export class BoardsClientAdapter {
	constructor(private readonly boardApi: BoardApi, private readonly logger: LegacyLogger) {
		this.logger.setContext('BoardsClientAdapter');
	}

	public async createBoard(params: CreateBoardBodyParams): Promise<CreateBoardResponse> {
		this.logger.log(`Creating board with the following values '${JSON.stringify(params)}'`);

		try {
			const response = await this.boardApi.boardControllerCreateBoard(params);
			return response.data;
		} catch (error) {
			this.logger.error(`Failed to create board`);
			throw error;
		}
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
