import { CoreModule } from '@core/core.module';
import { Logger } from '@core/logger';
import { RabbitMQWrapperModule } from '@infra/rabbitmq';
import { S3ClientModule } from '@infra/s3-client';
import { s3ConfigContent, s3ConfigLibraries } from '@modules/h5p-editor';
import { H5PEditorModule } from '@modules/h5p-editor/h5p-editor.app.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common/config-module-options';
import { H5PLibraryManagementService, H5pGitHubClient, h5PLibraryManagementConfig } from './service';

const imports = [
	ConfigModule.forRoot(createConfigModuleOptions(h5PLibraryManagementConfig)),
	CoreModule,
	H5PEditorModule,
	RabbitMQWrapperModule,
	S3ClientModule.register([s3ConfigContent, s3ConfigLibraries]),
];

const controllers = [];

const providers = [Logger, H5PLibraryManagementService, H5pGitHubClient];

@Module({
	imports,
	controllers,
	providers,
	exports: [],
})
export class H5PLibraryManagementModule {}
