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
} from '../loggable';
import { ExternalToolService } from './external-tool.service';

const base64ImageTypeSignatures: Record<string, ImageMimeType> = {
	'/9j/': ImageMimeType.JPEG,
	iVBORw0KGgo: ImageMimeType.PNG,
	R0lGODdh: ImageMimeType.GIF,
	R0lGODlh: ImageMimeType.GIF,
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

			const logoBase64: string = buffer.toString('base64');

			this.detectAndValidateLogoImageType(logoBase64);

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

		const externalToolLogo: ExternalToolLogo = new ExternalToolLogo({
			contentType: this.detectAndValidateLogoImageType(tool.logo).valueOf(),
			logo: Buffer.from(tool.logo, 'base64'),
		});

		return externalToolLogo;
	}

	public detectAndValidateLogoImageType(base64Image: string): ImageMimeType {
		const detectedSignature: string | undefined = Object.keys(base64ImageTypeSignatures).find((signature: string) =>
			base64Image.startsWith(signature)
		);

		if (!detectedSignature) {
			throw new ExternalToolLogoWrongFileTypeLoggableException();
		}

		const contentType: ImageMimeType = base64ImageTypeSignatures[detectedSignature];

		return contentType;
	}
}
