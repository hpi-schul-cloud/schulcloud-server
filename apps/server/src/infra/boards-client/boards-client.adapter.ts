import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BoardsClientConfig } from './boards-client.config';
import {
	BoardApi,
	BoardResponse,
	ColumnResponse,
	Configuration,
	CreateBoardBodyParams,
	CreateBoardResponse,
} from './generated';

@Injectable()
export class BoardsClientAdapter {
	constructor(private readonly configService: ConfigService<BoardsClientConfig, true>) {}

	public async createBoard(jwt: string, params: CreateBoardBodyParams): Promise<CreateBoardResponse> {
		const response = await this.boardApi(jwt).boardControllerCreateBoard(params);

		return response.data;
	}

	public async createBoardColumn(jwt: string, boardId: string): Promise<ColumnResponse> {
		const response = await this.boardApi(jwt).boardControllerCreateColumn(boardId);

		return response.data;
	}

	public async getBoardSkeletonById(jwt: string, boardId: string): Promise<BoardResponse> {
		const response = await this.boardApi(jwt).boardControllerGetBoardSkeleton(boardId);

		return response.data;
	}

	private boardApi(jwt: string): BoardApi {
		const basePath = this.configService.getOrThrow<string>('API_HOST');
		const configuration = new Configuration({
			basePath: `${basePath}/v3`,
			accessToken: jwt,
		});

		return new BoardApi(configuration);
	}
}
