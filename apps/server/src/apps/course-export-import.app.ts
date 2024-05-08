/* istanbul ignore file */
/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { CommonCartridgeModule } from '@src/modules/common-cartridge/common-cartridge.module';
import { WinstonLogger } from 'nest-winston';
import { install as sourceMapInstall } from 'source-map-support';

async function bootstrap() {
	sourceMapInstall();

	const nestApp = await NestFactory.create(CommonCartridgeModule);
	nestApp.useLogger(await nestApp.resolve(WinstonLogger));
	await nestApp.init();

	console.log('#############################################');
	console.log(`### Start course export & import service ###`);
	console.log('#############################################');
}
void bootstrap();
