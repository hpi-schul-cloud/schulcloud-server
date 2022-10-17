/* istanbul ignore file */
/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';

// register source-map-support for debugging
import { FilesStorageAMQPModule } from '@src/modules/files-storage';
import { install as sourceMapInstall } from 'source-map-support';

async function bootstrap() {
	sourceMapInstall();

	const nestApp = await NestFactory.createMicroservice(FilesStorageAMQPModule);
	await nestApp.init();

	console.log('#########################################');
	console.log(`### Start Files Storage AMQP Consumer ###`);
	console.log('#########################################');
}
void bootstrap();
