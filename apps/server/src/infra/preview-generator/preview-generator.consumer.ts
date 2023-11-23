import { RabbitPayload, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { FilesPreviewEvents, FilesPreviewExchange } from '@infra/rabbitmq';
import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { PreviewFileOptions } from './interface';
import { PreviewActionsLoggable } from './loggable/preview-actions.loggable';
import { PreviewGeneratorService } from './preview-generator.service';

@Injectable()
export class PreviewGeneratorConsumer {
	constructor(private readonly previewGeneratorService: PreviewGeneratorService, private logger: Logger) {
		this.logger.setContext(PreviewGeneratorConsumer.name);
	}

	@RabbitRPC({
		exchange: FilesPreviewExchange,
		routingKey: FilesPreviewEvents.GENERATE_PREVIEW,
		queue: FilesPreviewEvents.GENERATE_PREVIEW,
	})
	public async generatePreview(@RabbitPayload() payload: PreviewFileOptions) {
		this.logger.info(new PreviewActionsLoggable('PreviewGeneratorConsumer.generatePreview:start', payload));

		const response = await this.previewGeneratorService.generatePreview(payload);

		this.logger.info(new PreviewActionsLoggable('PreviewGeneratorConsumer.generatePreview:end', payload));

		return { message: response };
	}
}
