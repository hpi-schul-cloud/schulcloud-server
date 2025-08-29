import { Injectable } from '@nestjs/common';
import {
	BoardColumnApi,
	CardResponse,
	CreateCardBodyParams,
	CreateCardImportBodyParams,
	RenameBodyParams,
} from './generated';

@Injectable()
export class ColumnClientAdapter {
	constructor(private readonly columnApi: BoardColumnApi) {}

	public async updateBoardColumnTitle(columnId: string, params: RenameBodyParams): Promise<void> {
		await this.columnApi.columnControllerUpdateColumnTitle(columnId, params);
	}

	public async createCard(columnId: string, cardParams: CreateCardBodyParams): Promise<CardResponse> {
		const { data: cardResponse } = await this.columnApi.columnControllerCreateCard(columnId, cardParams);
		return cardResponse;
	}

	public async createCardWithContent(columnId: string, cardParams: CreateCardImportBodyParams): Promise<CardResponse> {
		const { data: cardResponse } = await this.columnApi.columnControllerCreateCardWithContent(columnId, cardParams);

		return cardResponse;
	}
}
