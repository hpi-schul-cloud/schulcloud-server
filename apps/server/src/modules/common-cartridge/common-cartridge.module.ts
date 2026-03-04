import { CoreModule } from '@core/core.module';
import { LoggerModule } from '@core/logger';
import { RABBITMQ_CONFIG_TOKEN, RabbitMQConfig } from '@infra/rabbitmq';
import {
	FILES_STORAGE_CLIENT_CONFIG_TOKEN,
	FilesStorageClientModule as FilesMetadataClientModule,
	FilesStorageClientConfig,
} from '@modules/files-storage-client';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { API_HOST_CONFIG_TOKEN, ApiHostConfig } from './api-client.config';
import { CommonCartridgeExportService, CommonCartridgeImportService } from './service';
import { CommonCartridgeExportMapper } from './service/common-cartridge-export.mapper';
import { CommonCartridgeImportMapper } from './service/common-cartridge-import.mapper';
import { CommonCartridgeUc } from './uc/common-cartridge.uc';
import { CommonCartridgeImportHandler } from './handler/common-cartridge-import.handler';
import { CommonCartridgeClientsModule } from '@infra/common-cartridge-clients/common-cartridge-clients.module';

@Module({
	imports: [
		LoggerModule,
		CqrsModule,
		HttpModule,
		CoreModule,
		FilesMetadataClientModule.register({
			exchangeConfigConstructor: FilesStorageClientConfig,
			exchangeConfigInjectionToken: FILES_STORAGE_CLIENT_CONFIG_TOKEN,
			configInjectionToken: RABBITMQ_CONFIG_TOKEN,
			configConstructor: RabbitMQConfig,
		}),
		CommonCartridgeClientsModule.register(API_HOST_CONFIG_TOKEN, ApiHostConfig),
	],
	providers: [
		CommonCartridgeExportMapper,
		CommonCartridgeImportMapper,
		CommonCartridgeUc,
		CommonCartridgeExportService,
		CommonCartridgeImportHandler,
		CommonCartridgeImportService,
	],
	exports: [CommonCartridgeUc],
})
export class CommonCartridgeModule {}
