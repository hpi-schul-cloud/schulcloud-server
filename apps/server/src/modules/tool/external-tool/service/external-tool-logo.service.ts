import { Inject } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { Logger } from '@src/core/logger';
import { EntityId } from '@shared/domain';
import { ExternalTool } from '../domain';
import {
	ExternalToolLogoFetchedLoggable,
	ExternalToolLogoNotFoundLoggableException,
	ExternalToolLogoSizeExceededLoggableException,
} from '../loggable';
import { IToolFeatures, ToolFeatures } from '../../tool-config';
import { ExternalToolLogo } from '../domain/external-tool-logo';
import { ExternalToolService } from './external-tool.service';
import { ExternalToolLogoFetchFailedLoggableException } from '../loggable/external-tool-logo-fetch-failed-loggable-exception';

const contentTypeDetector: Record<string, string> = {
	ffd8ffe0: 'image/jpeg',
	ffd8ffe1: 'image/jpeg',
	'89504e47': 'image/png',
	'47494638': 'image/gif',
};

export class ExternalToolLogoService {
	constructor(
		@Inject(ToolFeatures) private readonly toolFeatures: IToolFeatures,
		private readonly logger: Logger,
		private readonly httpService: HttpService,
		private readonly externalToolService: ExternalToolService
	) {}

	buildLogoUrl(template: string, externalTool: ExternalTool): string | undefined {
		const { logo, id } = externalTool;
		const backendUrl = this.toolFeatures.backEndUrl;

		if (logo) {
			const filledTemplate = template.replace(/\{id\}/g, id || '');
			return `${backendUrl}${filledTemplate}`;
		}

		return undefined;
	}

	validateLogoSize(externalTool: Partial<ExternalTool>): void {
		if (!externalTool.logo) {
			return;
		}

		const buffer: Buffer = Buffer.from(externalTool.logo, 'base64');

		if (buffer.length > this.toolFeatures.maxExternalToolLogoSizeInBytes) {
			throw new ExternalToolLogoSizeExceededLoggableException(
				externalTool.id,
				this.toolFeatures.maxExternalToolLogoSizeInBytes
			);
		}
	}

	async fetchLogo(externalTool: Partial<ExternalTool>): Promise<string | undefined> {
		if (externalTool.logoUrl) {
			const base64Logo: string = await this.fetchBase64Logo(externalTool.logoUrl);

			if (base64Logo) {
				return base64Logo;
			}
		}

		return undefined;
	}

	private async fetchBase64Logo(logoUrl: string): Promise<string> {
		try {
			const response: AxiosResponse<ArrayBuffer> = await lastValueFrom(
				this.httpService.get(logoUrl, { responseType: 'arraybuffer' })
			);
			this.logger.info(new ExternalToolLogoFetchedLoggable(logoUrl));

			const buffer: Buffer = Buffer.from(response.data);
			const logoBase64: string = buffer.toString('base64');

			return logoBase64;
		} catch (error) {
			throw new ExternalToolLogoFetchFailedLoggableException(logoUrl);
		}
	}

	async getExternalToolBinaryLogo(toolId: EntityId): Promise<ExternalToolLogo> {
		const tool: ExternalTool = await this.externalToolService.findExternalToolById(toolId);

		if (!tool.logo) {
			throw new ExternalToolLogoNotFoundLoggableException(toolId);
		}

		const logoBinaryData: Buffer = Buffer.from(tool.logo, 'base64');

		const externalToolLogo: ExternalToolLogo = new ExternalToolLogo({
			contentType: this.detectContentType(logoBinaryData),
			logo: logoBinaryData,
		});

		return externalToolLogo;
	}

	private detectContentType(imageBuffer: Buffer): string {
		const imageSignature: string = imageBuffer.toString('hex', 0, 4);

		const contentType: string = contentTypeDetector[imageSignature] || 'application/octet-stream';

		return contentType;
	}
}
