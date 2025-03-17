import { Injectable } from '@nestjs/common';
import { CreateContentElementBodyParams, RenameBodyParams } from '.';
import { BoardCardApi, CardControllerCreateElement201Response } from './generated';

@Injectable()
export class CardClientAdapter {
	constructor(private readonly cardApi: BoardCardApi) {}

	public async createCardElement(
		cardId: string,
		createContentElementBodyParams: CreateContentElementBodyParams
	): Promise<CardControllerCreateElement201Response> {
		const element = (await this.cardApi.cardControllerCreateElement(cardId, createContentElementBodyParams)).data;
		return element;
	}

	public async updateCardTitle(cardId: string, renameBodyParams: RenameBodyParams): Promise<void> {
		await this.cardApi.cardControllerUpdateCardTitle(cardId, renameBodyParams);
	}
}
