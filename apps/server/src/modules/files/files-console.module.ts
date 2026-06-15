import { LoggerModule } from '@core/logger';
import { AuthenticationClientModule } from '@infra/authentication-client';
import { ConfigurationModule } from '@infra/configuration';
import { StorageProviderRepo } from '@modules/school/repo';
import { Module } from '@nestjs/common';
import { FILES_CONSOLE_CONFIG_TOKEN, FilesConsoleConfig } from './files-console.config';
import { DeleteFilesConsole, DeleteFilesUc } from './job';
import { FilesRepo } from './repo';

@Module({
	imports: [
		LoggerModule,
		ConfigurationModule.register(FILES_CONSOLE_CONFIG_TOKEN, FilesConsoleConfig),
		AuthenticationClientModule.register(),
	],
	providers: [DeleteFilesConsole, DeleteFilesUc, FilesRepo, StorageProviderRepo],
	exports: [],
})
export class FilesConsoleModule {}
