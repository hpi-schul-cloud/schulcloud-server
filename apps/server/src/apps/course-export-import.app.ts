/* istanbul ignore file */
/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { LegacyLogger } from '@src/core/logger';
import { CommonCartridgeModule } from '@src/modules/common-cartridge/common-cartridge.module';
import { install as sourceMapInstall } from 'source-map-support';

async function bootstrap() {
	sourceMapInstall();

	const nestApp = await NestFactory.create(CommonCartridgeModule);
	nestApp.useLogger(await nestApp.resolve(LegacyLogger));
	await nestApp.init();

	console.log('#############################################');
	console.log(`### Start course export & import service ###`);
	console.log('#############################################');
}
void bootstrap();
