import { CoreModule } from '@core/core.module';
import { LoggerModule } from '@core/logger';
import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@imports-from-feathers';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common/config-module-options';
import { defaultMikroOrmOptions } from '@shared/common/defaultMikroOrmOptions';
import { FilesStorageConsumer } from './controller';
import { config } from './files-storage.config';
import { ENTITIES } from './files-storage.entity.imports';
import { FilesStorageModule } from './files-storage.module';

@Module({
	imports: [
		FilesStorageModule,
		CoreModule,
		LoggerModule,
		ConfigModule.forRoot(createConfigModuleOptions(config)),
		MikroOrmModule.forRoot({
			...defaultMikroOrmOptions,
			type: 'mongo',
			// TODO add mongoose options as mongo options (see database.js)
			clientUrl: DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: ENTITIES,

			// debug: true, // use it for locally debugging of querys
		}),
	],
	providers: [FilesStorageConsumer],
})
export class FilesStorageAMQPModule {}
