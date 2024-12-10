import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LegacyLogger } from '@src/core/logger';
import { firstValueFrom } from 'rxjs';
import { TldrawClientConfig } from '../interface';

type ApiKeyHeader = {
	'X-Api-Key': string;
	Accept: string;
};

@Injectable()
export class DrawingElementAdapterService {
	constructor(
		private logger: LegacyLogger,
		private readonly httpService: HttpService,
		private readonly configService: ConfigService<TldrawClientConfig, true>
	) {
		this.logger.setContext(DrawingElementAdapterService.name);
	}

	public async deleteDrawingBinData(parentId: string): Promise<void> {
		const baseUrl = this.configService.get<string>('TLDRAW_ADMIN_API_CLIENT_BASE_URL');
		const endpointUrl = '/api/tldraw-document';
		const tldrawDocumentEndpoint = new URL(endpointUrl, baseUrl).toString();

		await firstValueFrom(this.httpService.delete(`${tldrawDocumentEndpoint}/${parentId}`, this.defaultHeaders()));
	}

	private apiKeyHeader(): ApiKeyHeader {
		const apiKey = this.configService.get<string>('TLDRAW_ADMIN_API_CLIENT_API_KEY');

		return { 'X-Api-Key': apiKey, Accept: 'Application/json' };
	}

	private defaultHeaders(): { headers: ApiKeyHeader } {
		return {
			headers: this.apiKeyHeader(),
		};
	}
}
