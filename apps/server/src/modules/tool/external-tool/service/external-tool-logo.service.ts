import { Logger } from '@core/logger';
import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityId, ImageMimeType } from '@shared/domain/types';
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
	ExternalToolLogoWrongFormatLoggableException,
} from '../loggable';
import { ExternalToolService } from './external-tool.service';

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
			this.logger.debug(new ExternalToolLogoFetchedLoggable(logoUrl));

			const buffer: Buffer = Buffer.from(response.data);

			const logoBase64: string = buffer.toString('base64');

			let contentType: string | undefined;
			if (logoUrl.startsWith('data:')) {
				const [header] = logoUrl.split(';', 1);

				contentType = header.substring(5);
			} else {
				contentType = response.headers['content-type'] as string | undefined;
			}

			if (!contentType || !Object.values(ImageMimeType).includes(contentType as ImageMimeType)) {
				throw new ExternalToolLogoWrongFileTypeLoggableException();
			}

			return `data:${contentType};base64,${logoBase64}`;
		} catch (error) {
			if (error instanceof ExternalToolLogoWrongFileTypeLoggableException) {
				throw error;
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

		if (!tool.logo.startsWith('data:')) {
			throw new ExternalToolLogoWrongFormatLoggableException(toolId);
		}

		const [header, data] = tool.logo.split(',');
		const contentType: string = header.split(';')[0].split(':')[1];

		const externalToolLogo: ExternalToolLogo = new ExternalToolLogo({
			contentType,
			logo: Buffer.from(data, 'base64'),
		});

		return externalToolLogo;
	}
}
