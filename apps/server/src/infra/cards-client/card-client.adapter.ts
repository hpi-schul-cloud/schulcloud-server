import { Injectable } from '@nestjs/common';
import { RawAxiosRequestConfig } from 'axios';
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
	constructor(private readonly cardApi: BoardCardApi, private readonly elementApi: BoardElementApi) {}

	public async createCardElement(
		jwt: string,
		cardId: string,
		createContentElementBodyParams: CreateContentElementBodyParams
	): Promise<CardControllerCreateElement201Response> {
		const element = await this.cardApi.cardControllerCreateElement(
			cardId,
			createContentElementBodyParams,
			this.getAxiosConfig(jwt)
		);

		return element.data;
	}

	public async updateCardTitle(jwt: string, cardId: string, renameBodyParams: RenameBodyParams): Promise<void> {
		await this.cardApi.cardControllerUpdateCardTitle(cardId, renameBodyParams, this.getAxiosConfig(jwt));
	}

	public async updateCardElement(
		jwt: string,
		elementId: string,
		updateElementContentBodyParams: UpdateElementContentBodyParams
	): Promise<ElementControllerUpdateElement200Response> {
		const anyElementResponse = await this.elementApi.elementControllerUpdateElement(
			elementId,
			updateElementContentBodyParams,
			this.getAxiosConfig(jwt)
		);

		return anyElementResponse.data;
	}

	private getAxiosConfig(jwt: string): RawAxiosRequestConfig {
		return {
			headers: {
				Authorization: `Bearer ${jwt}`,
			},
		};
	}
}
