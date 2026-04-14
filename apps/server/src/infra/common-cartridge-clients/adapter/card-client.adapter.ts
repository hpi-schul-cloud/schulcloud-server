import { Injectable } from '@nestjs/common';
import {
	BoardCardApi,
	BoardElementApi,
	CardControllerCreateElement201Response,
	CardListResponse,
	CreateContentElementBodyParams,
	ElementControllerUpdateElement200Response,
	RenameBodyParams,
	UpdateElementContentBodyParams,
} from '../generated';
import { AdapterUtils } from './adapter.utils';

@Injectable()
export class CardClientAdapter {
	constructor(private readonly cardApi: BoardCardApi, private readonly elementApi: BoardElementApi) {}

	public async getAllBoardCardsByIds(jwt: string, cardsIds: string[]): Promise<CardListResponse> {
		const getBoardCardsResponse = await this.cardApi.cardControllerGetCards(
			cardsIds,
			AdapterUtils.createAxiosConfigForJwt(jwt)
		);

		return getBoardCardsResponse.data;
	}

	public async createCardElement(
		jwt: string,
		cardId: string,
		createContentElementBodyParams: CreateContentElementBodyParams
	): Promise<CardControllerCreateElement201Response> {
		const element = await AdapterUtils.retry('createCardElement', () =>
			this.cardApi.cardControllerCreateElement(
				cardId,
				createContentElementBodyParams,
				AdapterUtils.createAxiosConfigForJwt(jwt)
			)
		);

		return element.data;
	}

	public async updateCardTitle(jwt: string, cardId: string, renameBodyParams: RenameBodyParams): Promise<void> {
		await AdapterUtils.retry('updateCardTitle', () =>
			this.cardApi.cardControllerUpdateCardTitle(cardId, renameBodyParams, AdapterUtils.createAxiosConfigForJwt(jwt))
		);
	}

	public async updateCardElement(
		jwt: string,
		elementId: string,
		updateElementContentBodyParams: UpdateElementContentBodyParams
	): Promise<ElementControllerUpdateElement200Response> {
		const anyElementResponse = await AdapterUtils.retry('updateCardElement', () =>
			this.elementApi.elementControllerUpdateElement(
				elementId,
				updateElementContentBodyParams,
				AdapterUtils.createAxiosConfigForJwt(jwt)
			)
		);

		return anyElementResponse.data;
	}
}
