import { Configuration } from '@hpi-schul-cloud/commons';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AntivirusModule } from '@shared/infra/antivirus/antivirus.module';
import { CoreModule } from '@src/core';
import { LoggerModule } from '@src/core/logger';
import { AuthModule } from '@src/modules/authentication';
import { AuthorizationModule } from '@src/modules/authorization';
import { FileSecurityController, FilesStorageController } from './controller';
import { FilesStorageModule } from './files-storage.module';
import { FileRecordUC, FilesStorageUC } from './uc';

@Module({
	imports: [
		AuthorizationModule,
		FilesStorageModule,
		AuthModule,
		CoreModule,
		LoggerModule,
		HttpModule,
		AntivirusModule.forRoot({
			enabled: Configuration.get('ENABLE_FILE_SECURITY_CHECK') as boolean,
			filesServiceBaseUrl: Configuration.get('FILES_STORAGE__SERVICE_BASE_URL') as string,
			exchange: Configuration.get('ANTIVIRUS_EXCHANGE') as string,
			routingKey: Configuration.get('ANTIVIRUS_ROUTING_KEY') as string,
		}),
	],
	controllers: [FilesStorageController, FileSecurityController],
	providers: [FilesStorageUC, FileRecordUC],
})
export class FilesStorageApiModule {}
