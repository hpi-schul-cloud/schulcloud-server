import { RabbitPayload, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { LegacyLogger } from '@src/core/logger';
import { FilesStorageEvents, FilesStorageExchange } from '@src/shared/infra/rabbitmq';
import { PreviewFileOptions } from '../interface';
import { PreviewGeneratorService } from '../service/preview-generator.service';

@Injectable()
export class PreviewGeneratorConsumer {
	constructor(
		private readonly previewGeneratorService: PreviewGeneratorService,
		private logger: LegacyLogger, // eslint-disable-next-line @typescript-eslint/no-unused-vars
		private readonly orm: MikroORM // don't remove it, we need it for @UseRequestContext
	) {
		this.logger.setContext(PreviewGeneratorConsumer.name);
	}

	@RabbitRPC({
		exchange: FilesStorageExchange,
		routingKey: FilesStorageEvents.GENERATE_PREVIEW,
		queue: FilesStorageEvents.GENERATE_PREVIEW,
	})
	@UseRequestContext()
	public async copyFilesOfParent(@RabbitPayload() payload: PreviewFileOptions) {
		this.logger.debug({ action: 'generate preview', payload });

		const response = await this.previewGeneratorService.generatePreview(payload);

		return { message: response };
	}
}
