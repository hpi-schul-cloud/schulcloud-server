import { Injectable } from '@nestjs/common';
import { LegacyLogger } from '@src/core/logger';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { DeletionClientConfig } from '../interface';

@Injectable()
export class DrawingElementAdapterService {
	private readonly baseUrl: string;

	private readonly apiKey: string;

	private readonly tldrawDocumentEndpoint: string;

	constructor(
		private logger: LegacyLogger,
		private readonly httpService: HttpService,
		private readonly configService: ConfigService<DeletionClientConfig, true>
	) {
		this.logger.setContext(DrawingElementAdapterService.name);

		this.baseUrl = this.configService.get<string>('TLDRAW_ADMIN_API_CLIENT_BASE_URL');
		this.apiKey = this.configService.get<string>('TLDRAW_ADMIN_API_CLIENT_API_KEY');

		this.tldrawDocumentEndpoint = new URL('/api/v3/tldraw-document/', this.baseUrl).toString();
	}

	async deleteDrawingBinData(docName: string): Promise<void> {
		await firstValueFrom(this.httpService.delete(`${this.tldrawDocumentEndpoint}${docName}`, this.defaultHeaders()));
	}

	private apiKeyHeader() {
		return { 'X-Api-Key': this.apiKey, Accept: 'Application/json' };
	}

	private defaultHeaders() {
		return {
			headers: this.apiKeyHeader(),
		};
	}
}
