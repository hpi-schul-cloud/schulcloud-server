/* istanbul ignore file */
/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { LearnroomApiModule } from '@src/modules/learnroom/learnroom-api.module';
import { WinstonLogger } from 'nest-winston';
import { install as sourceMapInstall } from 'source-map-support';

async function bootstrap() {
	sourceMapInstall();

	const nestApp = await NestFactory.create(LearnroomApiModule);
	nestApp.useLogger(await nestApp.resolve(WinstonLogger));
	await nestApp.init();

	console.log('#############################################');
	console.log(`### Start common cartridge export & import service ###`);
	console.log('#############################################');
}
void bootstrap();
