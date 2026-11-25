import { CommonCartridgeClientsModule } from '@infra/common-cartridge-clients/common-cartridge-clients.module';
import { ConfigurationModule } from '@infra/configuration';
import { JwtIssuerModule } from '@infra/jwt-issuer';
import { JwtWhitelistModule } from '@infra/jwt-whitelist';
import { LoggerModule } from '@infra/logger';
import { AccountModule } from '@modules/account';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { BoardImportJobConsumer } from './amqp/board-import-job.consumer';
import { BoardImportAmqpModule } from './board-import-amqp.module';
import {
	BOARD_IMPORT_CONFIG_TOKEN,
	BOARD_IMPORT_SERVER_API_CONFIG_TOKEN,
	BoardImportConfig,
	BoardImportServerApiConfig,
} from './board-import.config';
import { BOARD_IMPORT_JOB_REPO } from './domain';
import { BoardImportJobProcessService } from './domain/service/board-import-job-process.service';
import { BoardImportPlaceholderBoardService } from './domain/service/board-import-placeholder-board.service';
import { BoardImportRunnerService } from './domain/service/board-import-runner.service';
import { BoardImportTokenService } from './domain/service/board-import-token.service';
import { BoardImportJobMikroOrmRepo } from './repo/mikro-orm';

@Module({
	imports: [
		ConfigurationModule.register(BOARD_IMPORT_CONFIG_TOKEN, BoardImportConfig),
		BoardImportAmqpModule,
		LoggerModule,
		UserModule,
		AccountModule,
		JwtIssuerModule,
		JwtWhitelistModule.register(),
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
		BoardImportJobConsumer,
	],
})
export class BoardImportWorkerModule {}
