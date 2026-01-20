import { Injectable } from '@nestjs/common';
import { BoardColumnApi, CardResponse, CreateCardBodyParams, RenameBodyParams } from './generated';
import { RawAxiosRequestConfig } from 'axios';

@Injectable()
export class ColumnClientAdapter {
	constructor(private readonly columnApi: BoardColumnApi) {}

	public async updateBoardColumnTitle(jwt: string, columnId: string, params: RenameBodyParams): Promise<void> {
		await this.columnApi.columnControllerUpdateColumnTitle(columnId, params, this.getAxiosConfig(jwt));
	}

	public async createCard(jwt: string, columnId: string, cardParams: CreateCardBodyParams): Promise<CardResponse> {
		const { data: cardResponse } = await this.columnApi.columnControllerCreateCard(
			columnId,
			cardParams,
			this.getAxiosConfig(jwt)
		);
		return cardResponse;
	}

	private getAxiosConfig(jwt: string): RawAxiosRequestConfig {
		return {
			headers: {
				Authorization: `Bearer ${jwt}`,
			},
		};
	}
}
