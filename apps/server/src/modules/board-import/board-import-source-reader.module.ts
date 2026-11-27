import { ConfigurationModule } from '@infra/configuration';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { BoardImportSourceModule } from './board-import-source.module';
import { BOARD_IMPORT_SOURCE_REQUEST_CONFIG_TOKEN, BoardImportSourceRequestConfig } from './board-import.config';
import { BoardImportSourceHttpClientService } from './domain/service/board-import-source-http-client.service';
import { BoardImportSourceReaderRegistryService } from './domain/service/board-import-source-reader-registry.service';

@Module({
	imports: [
		ConfigurationModule.register(BOARD_IMPORT_SOURCE_REQUEST_CONFIG_TOKEN, BoardImportSourceRequestConfig),
		// An own axios instance, so that an interceptor of another module cannot add a header to a request to a source.
		HttpModule.register({}),
		BoardImportSourceModule,
	],
	providers: [BoardImportSourceReaderRegistryService, BoardImportSourceHttpClientService],
	exports: [BoardImportSourceReaderRegistryService, BoardImportSourceHttpClientService],
})
export class BoardImportSourceReaderModule {}
