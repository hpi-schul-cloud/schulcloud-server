/* istanbul ignore file */
/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';

// register source-map-support for debugging
import { FilesStorageAMQPModule } from '@modules/files-storage/files-storage-amqp.module';
import { install as sourceMapInstall } from 'source-map-support';

async function bootstrap() {
	sourceMapInstall();

	const nestApp = await NestFactory.create(FilesStorageAMQPModule);
	await nestApp.init();

	console.log('#########################################');
	console.log(`### Start Files Storage AMQP Consumer ###`);
	console.log('#########################################');
}
void bootstrap();
