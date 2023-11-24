import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RabbitMQWrapperModule } from '@infra/rabbitmq';
import { S3ClientModule } from '@infra/s3-client';
import { createConfigModuleOptions } from '@src/config';
import { CoreModule } from '@src/core';
import { Logger } from '@src/core/logger';
import { H5PEditorModule, s3ConfigContent, s3ConfigLibraries } from '@modules/h5p-editor';
import { H5PLibraryManagementService, h5PLibraryManagementConfig } from './service';

const imports = [
	ConfigModule.forRoot(createConfigModuleOptions(h5PLibraryManagementConfig)),
	CoreModule,
	H5PEditorModule,
	RabbitMQWrapperModule,
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
