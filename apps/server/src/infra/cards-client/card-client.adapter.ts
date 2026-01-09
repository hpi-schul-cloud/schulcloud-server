import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CardClientConfig, CreateContentElementBodyParams, RenameBodyParams } from '.';
import {
	BoardCardApi,
	BoardElementApi,
	CardControllerCreateElement201Response,
	Configuration,
	ElementControllerUpdateElement200Response,
	UpdateElementContentBodyParams,
} from './generated';

@Injectable()
export class CardClientAdapter {
	constructor(private readonly configService: ConfigService<CardClientConfig, true>) {}

	public async createCardElement(
		jwt: string,
		cardId: string,
		createContentElementBodyParams: CreateContentElementBodyParams
	): Promise<CardControllerCreateElement201Response> {
		const element = await this.cardApi(jwt).cardControllerCreateElement(cardId, createContentElementBodyParams);

		return element.data;
	}

	public async updateCardTitle(jwt: string, cardId: string, renameBodyParams: RenameBodyParams): Promise<void> {
		await this.cardApi(jwt).cardControllerUpdateCardTitle(cardId, renameBodyParams);
	}

	public async updateCardElement(
		jwt: string,
		elementId: string,
		updateElementContentBodyParams: UpdateElementContentBodyParams
	): Promise<ElementControllerUpdateElement200Response> {
		const anyElementResponse = await this.elementAPI(jwt).elementControllerUpdateElement(
			elementId,
			updateElementContentBodyParams
		);

		return anyElementResponse.data;
	}

	private cardApi(jwt: string): BoardCardApi {
		const basePath = this.configService.getOrThrow<string>('API_HOST');
		const configuration = new Configuration({
			basePath: `${basePath}/v3`,
			accessToken: jwt,
		});

		return new BoardCardApi(configuration);
	}

	private elementAPI(jwt: string): BoardElementApi {
		const basePath = this.configService.getOrThrow<string>('API_HOST');
		const configuration = new Configuration({
			basePath: `${basePath}/v3`,
			accessToken: jwt,
		});

		return new BoardElementApi(configuration);
	}
}
