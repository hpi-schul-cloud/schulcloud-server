import { CommonCartridgeClientsModule } from '@infra/common-cartridge-clients/common-cartridge-clients.module';
import { ConfigurationModule } from '@infra/configuration';
import { JwtIssuerModule } from '@infra/jwt-issuer';
import { LoggerModule } from '@infra/logger';
import { AccountModule } from '@modules/account';
import { UserModule } from '@modules/user';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { BoardImportJobConsumer } from './amqp/board-import-job.consumer';
import { BoardImportAmqpModule } from './board-import-amqp.module';
import {
	BOARD_IMPORT_CONFIG_TOKEN,
	BOARD_IMPORT_SERVER_API_CONFIG_TOKEN,
	BOARD_IMPORT_SOURCE_CONFIG_TOKEN,
	BOARD_IMPORT_SOURCE_REQUEST_CONFIG_TOKEN,
	BoardImportConfig,
	BoardImportServerApiConfig,
	BoardImportSourceConfig,
	BoardImportSourceRequestConfig,
} from './board-import.config';
import { BOARD_IMPORT_JOB_REPO } from './domain';
import { BoardImportJobProcessService } from './domain/service/board-import-job-process.service';
import { BoardImportLinkCheckService } from './domain/service/board-import-link-check.service';
import { BoardImportPlaceholderBoardService } from './domain/service/board-import-placeholder-board.service';
import { BoardImportRunnerService } from './domain/service/board-import-runner.service';
import { BoardImportSourceHttpClientService } from './domain/service/board-import-source-http-client.service';
import { BoardImportSourceService } from './domain/service/board-import-source.service';
import { BoardImportTokenService } from './domain/service/board-import-token.service';
import { BoardImportJobMikroOrmRepo } from './repo/mikro-orm';

@Module({
	imports: [
		ConfigurationModule.register(BOARD_IMPORT_CONFIG_TOKEN, BoardImportConfig),
		ConfigurationModule.register(BOARD_IMPORT_SOURCE_CONFIG_TOKEN, BoardImportSourceConfig),
		ConfigurationModule.register(BOARD_IMPORT_SOURCE_REQUEST_CONFIG_TOKEN, BoardImportSourceRequestConfig),
		HttpModule,
		BoardImportAmqpModule,
		LoggerModule,
		UserModule,
		AccountModule,
		JwtIssuerModule,
		CommonCartridgeClientsModule.register(BOARD_IMPORT_SERVER_API_CONFIG_TOKEN, BoardImportServerApiConfig),
	],
	providers: [
		{
			provide: BOARD_IMPORT_JOB_REPO,
			useClass: BoardImportJobMikroOrmRepo,
		},
		BoardImportJobProcessService,
		BoardImportRunnerService,
		BoardImportTokenService,
		BoardImportPlaceholderBoardService,
		BoardImportSourceService,
		BoardImportLinkCheckService,
		BoardImportSourceHttpClientService,
		BoardImportJobConsumer,
	],
})
export class BoardImportWorkerModule {}
