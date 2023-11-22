import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { Module, NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ALL_ENTITIES } from '@shared/domain';
import { RabbitMQWrapperModule } from '@infra/rabbitmq';
import { S3ClientModule } from '@infra/s3-client';
import { DB_PASSWORD, DB_URL, DB_USERNAME, createConfigModuleOptions } from '@src/config';
import { CoreModule } from '@src/core';
import { Logger } from '@src/core/logger';
import { H5PEditorModule, s3ConfigContent, s3ConfigLibraries } from '@modules/h5p-editor';
// This export is always invalid. It is not allow to export repos or entities.
// In context of no domain object exists maybe it is ok. But i think it is not needed.
// All this database / mikroORM Stuff is done in H5PEditorModule.
// If yes remove exports from modules/h5p-editor/index.ts
// import { H5PEditorModule, s3ConfigContent, s3ConfigLibraries } from '@modules/h5p-editor';
import { H5PContent, InstalledLibrary } from '@modules/h5p-editor/entity';
import { H5PLibraryManagementService, h5PLibraryManagementConfig } from './service';

const defaultMikroOrmOptions: MikroOrmModuleSyncOptions = {
	findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) =>
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		new NotFoundException(`The requested ${entityName}: ${where} has not been found.`),
};

const imports = [
	ConfigModule.forRoot(createConfigModuleOptions(h5PLibraryManagementConfig)),
	CoreModule,
	H5PEditorModule,
	RabbitMQWrapperModule,
	MikroOrmModule.forRoot({
		...defaultMikroOrmOptions,
		type: 'mongo',
		// TODO add mongoose options as mongo options (see database.js)
		clientUrl: DB_URL,
		password: DB_PASSWORD,
		user: DB_USERNAME,
		// allowGlobalContext: true, Please not
		entities: [...ALL_ENTITIES, H5PContent, InstalledLibrary],
	}),
	S3ClientModule.register([s3ConfigContent, s3ConfigLibraries]),
];

const controllers = [];

const providers = [Logger, H5PLibraryManagementService];

@Module({
	imports,
	controllers,
	providers,
	exports: [],
})
export class H5PLibraryManagementModule {}
