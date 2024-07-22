import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityId } from '@shared/domain/types';
import { Logger } from '@src/core/logger';
import { AxiosResponse } from 'axios';
import { lastValueFrom } from 'rxjs';
import { ToolConfig } from '../../tool-config';
import { ExternalTool } from '../domain';
import { ExternalToolLogo } from '../domain/external-tool-logo';
import {
	ExternalToolLogoFetchedLoggable,
	ExternalToolLogoFetchFailedLoggableException,
	ExternalToolLogoNotFoundLoggableException,
	ExternalToolLogoSizeExceededLoggableException,
	ExternalToolLogoWrongFileTypeLoggableException,
} from '../loggable';
import { ExternalToolService } from './external-tool.service';

const contentTypeDetector: Record<string, string> = {
	ffd8ffe0: 'image/jpeg',
	ffd8ffe1: 'image/jpeg',
	'89504e47': 'image/png',
	'47494638': 'image/gif',
};

@Injectable()
export class ExternalToolLogoService {
	constructor(
		private readonly configService: ConfigService<ToolConfig, true>,
		private readonly logger: Logger,
		private readonly httpService: HttpService,
		private readonly externalToolService: ExternalToolService
	) {}

	public buildLogoUrl(externalTool: ExternalTool): string | undefined {
		const { logo, id } = externalTool;
		const backendUrl = this.configService.get<string>('CTL_TOOLS_BACKEND_URL');

		if (logo && id) {
			return `${backendUrl}/v3/tools/external-tools/${id}/logo`;
		}

		return undefined;
	}

	public validateLogoSize(externalTool: Partial<ExternalTool>): void {
		if (!externalTool.logo) {
			return;
		}

		const buffer: Buffer = Buffer.from(externalTool.logo, 'base64');

		if (buffer.length > this.configService.get('CTL_TOOLS__EXTERNAL_TOOL_MAX_LOGO_SIZE_IN_BYTES')) {
			throw new ExternalToolLogoSizeExceededLoggableException(
				externalTool.id,
				this.configService.get('CTL_TOOLS__EXTERNAL_TOOL_MAX_LOGO_SIZE_IN_BYTES')
			);
		}
	}

	public async fetchLogo(externalTool: Partial<ExternalTool>): Promise<string | undefined> {
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
			this.detectContentTypeOrThrow(buffer);

			const logoBase64: string = buffer.toString('base64');

			return logoBase64;
		} catch (error) {
			if (error instanceof ExternalToolLogoWrongFileTypeLoggableException) {
				throw new ExternalToolLogoWrongFileTypeLoggableException();
			} else if (error instanceof HttpException) {
				throw new ExternalToolLogoFetchFailedLoggableException(logoUrl, error.getStatus());
			} else {
				throw new ExternalToolLogoFetchFailedLoggableException(logoUrl);
			}
		}
	}

	public async getExternalToolBinaryLogo(toolId: EntityId): Promise<ExternalToolLogo> {
		const tool: ExternalTool = await this.externalToolService.findById(toolId);

		if (!tool.logo) {
			throw new ExternalToolLogoNotFoundLoggableException(toolId);
		}

		const logoBinaryData: Buffer = Buffer.from(tool.logo, 'base64');

		const externalToolLogo: ExternalToolLogo = new ExternalToolLogo({
			contentType: this.detectContentTypeOrThrow(logoBinaryData),
			logo: logoBinaryData,
		});

		return externalToolLogo;
	}

	private detectContentTypeOrThrow(imageBuffer: Buffer): string {
		const imageSignature: string = imageBuffer.toString('hex', 0, 4);

		const contentType: string | ExternalToolLogoWrongFileTypeLoggableException =
			contentTypeDetector[imageSignature] || new ExternalToolLogoWrongFileTypeLoggableException();

		if (contentType instanceof ExternalToolLogoWrongFileTypeLoggableException) {
			throw new ExternalToolLogoWrongFileTypeLoggableException();
		}

		return contentType;
	}
}
