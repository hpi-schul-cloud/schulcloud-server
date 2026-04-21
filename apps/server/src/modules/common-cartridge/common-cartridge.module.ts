import { CoreModule } from '@core/core.module';
import { LoggerModule } from '@core/logger';
import { CommonCartridgeClientsModule } from '@infra/common-cartridge-clients/common-cartridge-clients.module';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { API_HOST_CONFIG_TOKEN, ApiHostConfig } from './api-client.config';
import { COMMON_CARTRIDGE_CONFIG_TOKEN, CommonCartridgeConfig } from './common-cartridge.config';
import { CommonCartridgeImportHandler } from './handler/common-cartridge-import.handler';
import { CommonCartridgeExportService, CommonCartridgeImportService } from './service';
import { CommonCartridgeExportMapper } from './service/common-cartridge-export.mapper';
import { CommonCartridgeImportMapper } from './service/common-cartridge-import.mapper';
import { CommonCartridgeUc } from './uc/common-cartridge.uc';

@Module({
	imports: [
		LoggerModule,
		CqrsModule,
		HttpModule,
		CoreModule,
		CommonCartridgeClientsModule.register(API_HOST_CONFIG_TOKEN, ApiHostConfig),
	],
	providers: [
		{ provide: COMMON_CARTRIDGE_CONFIG_TOKEN, useClass: CommonCartridgeConfig },
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
