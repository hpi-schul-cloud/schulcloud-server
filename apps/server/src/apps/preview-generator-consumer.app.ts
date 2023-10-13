/* istanbul ignore file */
/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { PreviewGeneratorAMQPModule } from '@src/modules/files-storage/files-preview-amqp.module';
import { install as sourceMapInstall } from 'source-map-support';

async function bootstrap() {
	sourceMapInstall();

	const nestApp = await NestFactory.createMicroservice(PreviewGeneratorAMQPModule);
	await nestApp.init();

	console.log('#############################################');
	console.log(`### Start Preview Generator AMQP Consumer ###`);
	console.log('#############################################');
}
void bootstrap();
