import { RabbitPayload, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { LegacyLogger } from '@src/core/logger';
import { FilesPreviewEvents, FilesPreviewExchange } from '@src/shared/infra/rabbitmq';
import { PreviewFileOptions } from './interface';
import { PreviewGeneratorService } from './preview-generator.service';

@Injectable()
export class PreviewGeneratorConsumer {
	constructor(private readonly previewGeneratorService: PreviewGeneratorService, private logger: LegacyLogger) {
		this.logger.setContext(PreviewGeneratorConsumer.name);
	}

	@RabbitRPC({
		exchange: FilesPreviewExchange,
		routingKey: FilesPreviewEvents.GENERATE_PREVIEW,
		queue: FilesPreviewEvents.GENERATE_PREVIEW,
	})
	public async generatePreview(@RabbitPayload() payload: PreviewFileOptions) {
		this.logger.debug({ action: 'generate preview', payload });

		const response = await this.previewGeneratorService.generatePreview(payload);

		return { message: response };
	}
}
