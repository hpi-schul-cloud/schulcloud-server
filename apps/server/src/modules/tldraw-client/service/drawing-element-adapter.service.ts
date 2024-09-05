import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LegacyLogger } from '@src/core/logger';
import { firstValueFrom } from 'rxjs';
import { TldrawClientConfig } from '../interface';

@Injectable()
export class DrawingElementAdapterService {
	constructor(
		private logger: LegacyLogger,
		private readonly httpService: HttpService,
		private readonly configService: ConfigService<TldrawClientConfig, true>
	) {
		this.logger.setContext(DrawingElementAdapterService.name);
	}

	async deleteDrawingBinData(parentId: string): Promise<void> {
		const baseUrl = this.configService.get<string>('TLDRAW_ADMIN_API_CLIENT_BASE_URL');
		const isTlDraw2 = this.configService.get<boolean>('WITH_TLDRAW2');
		const endpointUrl = isTlDraw2 ? 'tldraw-document' : '/api/v3/tldraw-document';
		const tldrawDocumentEndpoint = new URL(endpointUrl, baseUrl).toString();

		await firstValueFrom(this.httpService.delete(`${tldrawDocumentEndpoint}/${parentId}`, this.defaultHeaders()));
	}

	private apiKeyHeader() {
		const apiKey = this.configService.get<string>('TLDRAW_ADMIN_API_CLIENT_API_KEY');

		return { 'X-Api-Key': apiKey, Accept: 'Application/json' };
	}

	private defaultHeaders() {
		return {
			headers: this.apiKeyHeader(),
		};
	}
}
