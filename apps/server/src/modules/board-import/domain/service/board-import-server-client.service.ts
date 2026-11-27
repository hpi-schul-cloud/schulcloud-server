import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { TypeGuard } from '@shared/common/guards';
import { lastValueFrom } from 'rxjs';
import { BOARD_IMPORT_SERVER_API_CONFIG_TOKEN, BoardImportServerApiConfig } from '../../board-import.config';
import { type BoardImportInstanceFeatures } from '../type';

const REQUEST_TIMEOUT_IN_MS = 30000;

export interface BoardImportLinkMetaTags {
	title: string;
	description: string;
	originalImageUrl?: string;
}

// The requests to the server API that the generated clients of the worker do not have.
@Injectable()
export class BoardImportServerClientService {
	constructor(
		private readonly httpService: HttpService,
		@Inject(BOARD_IMPORT_SERVER_API_CONFIG_TOKEN) private readonly config: BoardImportServerApiConfig
	) {}

	public async getInstanceFeatures(): Promise<BoardImportInstanceFeatures> {
		const response = await lastValueFrom(
			this.httpService.get<unknown>(`${this.config.basePath}/v3/config/public`, { timeout: REQUEST_TIMEOUT_IN_MS })
		);
		const linkElementEnabled = TypeGuard.getValueFromObjectKey(
			response.data,
			'FEATURE_COLUMN_BOARD_LINK_ELEMENT_ENABLED'
		);
		// A missing switch must not count as on or off, so the attempt fails.
		if (!TypeGuard.isBoolean(linkElementEnabled)) {
			throw new Error('The public config of the server has no switch for the link element');
		}
		const features: BoardImportInstanceFeatures = { linkElementEnabled };

		return features;
	}

	public async getLinkMetaTags(jwt: string, url: string): Promise<BoardImportLinkMetaTags> {
		const response = await lastValueFrom(
			this.httpService.post<unknown>(
				`${this.config.basePath}/v3/meta-tag-extractor`,
				{ url },
				{ timeout: REQUEST_TIMEOUT_IN_MS, headers: { Authorization: `Bearer ${jwt}` } }
			)
		);
		const metaTags: BoardImportLinkMetaTags = {
			title: this.getText(response.data, 'title') ?? '',
			description: this.getText(response.data, 'description') ?? '',
			originalImageUrl: this.getText(response.data, 'originalImageUrl'),
		};

		return metaTags;
	}

	private getText(data: unknown, key: string): string | undefined {
		const value = TypeGuard.getValueFromObjectKey(data, key);
		const text = TypeGuard.isString(value) && value !== '' ? value : undefined;

		return text;
	}
}
