import { Injectable } from '@nestjs/common';
import { CreateContentElementBodyParams, RenameBodyParams } from '.';
import { BoardCardApi } from './generated';

@Injectable()
export class CardClientAdapter {
	constructor(private readonly cardApi: BoardCardApi) {}

	public async createCardElement(
		cardId: string,
		createContentElementBodyParams: CreateContentElementBodyParams
	): Promise<void> {
		await this.cardApi.cardControllerCreateElement(cardId, createContentElementBodyParams);
	}

	public async updateCardTitle(cardId: string, renameBodyParams: RenameBodyParams): Promise<void> {
		await this.cardApi.cardControllerUpdateCardTitle(cardId, renameBodyParams);
	}
}
