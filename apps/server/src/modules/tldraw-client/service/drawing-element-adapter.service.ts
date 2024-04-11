import { Injectable } from '@nestjs/common';
import { LegacyLogger } from '@src/core/logger';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
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

	async deleteDrawingBinData(docName: string): Promise<void> {
		const baseUrl = this.configService.get<string>('TLDRAW_ADMIN_API_CLIENT_BASE_URL');
		const tldrawDocumentEndpoint = new URL('/api/v3/tldraw-document', baseUrl).toString();
		await firstValueFrom(this.httpService.delete(`${tldrawDocumentEndpoint}/${docName}`, this.defaultHeaders()));
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
