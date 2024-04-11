/* istanbul ignore file */
/* eslint-disable no-console */
import { PreviewGeneratorAMQPModule } from '@modules/files-storage/files-preview-amqp.module';
import { NestFactory } from '@nestjs/core';
import { install as sourceMapInstall } from 'source-map-support';

async function bootstrap() {
	sourceMapInstall();

	const nestApp = await NestFactory.create(PreviewGeneratorAMQPModule);
	await nestApp.init();

	console.log('#############################################');
	console.log(`### Start Preview Generator AMQP Consumer ###`);
	console.log('#############################################');
}
void bootstrap();
