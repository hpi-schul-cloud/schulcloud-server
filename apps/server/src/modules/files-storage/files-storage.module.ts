import { LoggerModule } from '@core/logger';
import { Configuration } from '@hpi-schul-cloud/commons';
import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@imports-from-feathers';
import { AntivirusModule } from '@infra/antivirus';
import { PreviewGeneratorProducerModule } from '@infra/preview-generator';
import { RabbitMQWrapperModule } from '@infra/rabbitmq';
import { S3ClientModule } from '@infra/s3-client';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { defaultMikroOrmOptions } from '@shared/common/defaultMikroOrmOptions';
import { ALL_ENTITIES } from '@shared/domain/entity';
import { FileRecord, FileRecordSecurityCheck } from './entity';
import { s3Config } from './files-storage.config';
import { FileRecordRepo } from './repo';
import { FilesStorageService, PreviewService } from './service';

const imports = [
	LoggerModule,
	AntivirusModule.forRoot({
		enabled: Configuration.get('ENABLE_FILE_SECURITY_CHECK') as boolean,
		filesServiceBaseUrl: Configuration.get('FILES_STORAGE__SERVICE_BASE_URL') as string,
		exchange: Configuration.get('ANTIVIRUS_EXCHANGE') as string,
		routingKey: Configuration.get('ANTIVIRUS_ROUTING_KEY') as string,
		hostname: Configuration.get('CLAMAV__SERVICE_HOSTNAME') as string,
		port: Configuration.get('CLAMAV__SERVICE_PORT') as number,
	}),
	S3ClientModule.register([s3Config]),
	PreviewGeneratorProducerModule,
];
const providers = [FilesStorageService, PreviewService, FileRecordRepo];

@Module({
	imports: [
		...imports,
		RabbitMQWrapperModule,
		MikroOrmModule.forRoot({
			...defaultMikroOrmOptions,
			type: 'mongo',
			// TODO add mongoose options as mongo options (see database.js)
			clientUrl: DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: [...ALL_ENTITIES, FileRecord, FileRecordSecurityCheck],

			// debug: true, // use it for locally debugging of querys
		}),
	],
	providers,
	exports: [FilesStorageService, PreviewService],
})
export class FilesStorageModule {}
