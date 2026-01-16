import { Injectable } from '@nestjs/common';
import { BoardColumnApi, CardResponse, Configuration, CreateCardBodyParams, RenameBodyParams } from './generated';
import { ConfigService } from '@nestjs/config';
import { ColumnClientConfig } from './column-client.config';

@Injectable()
export class ColumnClientAdapter {
	constructor(private readonly configService: ConfigService<ColumnClientConfig, true>) {}

	public async updateBoardColumnTitle(jwt: string, columnId: string, params: RenameBodyParams): Promise<void> {
		await this.columnApi(jwt).columnControllerUpdateColumnTitle(columnId, params);
	}

	public async createCard(jwt: string, columnId: string, cardParams: CreateCardBodyParams): Promise<CardResponse> {
		const { data: cardResponse } = await this.columnApi(jwt).columnControllerCreateCard(columnId, cardParams);
		return cardResponse;
	}

	private columnApi(jwt: string): BoardColumnApi {
		const basePath = this.configService.getOrThrow<string>('API_HOST');
		const configuration = new Configuration({
			basePath: `${basePath}/v3`,
			accessToken: jwt,
		});

		return new BoardColumnApi(configuration);
	}
}
