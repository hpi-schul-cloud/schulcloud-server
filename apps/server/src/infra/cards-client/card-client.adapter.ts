import { Injectable } from '@nestjs/common';
import { CreateContentElementBodyParams, RenameBodyParams } from '.';
import {
	BoardCardApi,
	BoardElementApi,
	CardControllerCreateElement201Response,
	ElementControllerUpdateElement200Response,
	UpdateElementContentBodyParams,
} from './generated';

@Injectable()
export class CardClientAdapter {
	constructor(private readonly cardApi: BoardCardApi, private readonly elementAPI: BoardElementApi) {}

	public async createCardElement(
		cardId: string,
		createContentElementBodyParams: CreateContentElementBodyParams
	): Promise<CardControllerCreateElement201Response> {
		const element = await this.cardApi.cardControllerCreateElement(cardId, createContentElementBodyParams);

		return element.data;
	}

	public async updateCardTitle(cardId: string, renameBodyParams: RenameBodyParams): Promise<void> {
		await this.cardApi.cardControllerUpdateCardTitle(cardId, renameBodyParams);
	}

	public async updateCardElement(
		elementId: string,
		updateElementContentBodyParams: UpdateElementContentBodyParams
	): Promise<ElementControllerUpdateElement200Response> {
		const anyElementResponse = await this.elementAPI.elementControllerUpdateElement(
			elementId,
			updateElementContentBodyParams
		);

		return anyElementResponse.data;
	}
}
