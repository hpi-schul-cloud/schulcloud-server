import { Injectable } from '@nestjs/common';
import { BoardColumnApi, CardResponse, CreateCardBodyParams, RenameBodyParams } from '../generated';
import { AdapterUtils } from './adapter.utils';

@Injectable()
export class ColumnClientAdapter {
	constructor(private readonly columnApi: BoardColumnApi) {}

	public async updateBoardColumnTitle(jwt: string, columnId: string, params: RenameBodyParams): Promise<void> {
		await AdapterUtils.retry(() =>
			this.columnApi.columnControllerUpdateColumnTitle(columnId, params, AdapterUtils.createAxiosConfigForJwt(jwt))
		);
	}

	public async createCard(jwt: string, columnId: string, cardParams: CreateCardBodyParams): Promise<CardResponse> {
		const { data: cardResponse } = await AdapterUtils.retry(() =>
			this.columnApi.columnControllerCreateCard(columnId, cardParams, AdapterUtils.createAxiosConfigForJwt(jwt))
		);
		return cardResponse;
	}
}
