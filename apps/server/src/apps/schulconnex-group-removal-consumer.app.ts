/* istanbul ignore file */
/* eslint-disable no-console */
import { SchulconnexGroupRemovalAMQPModule } from '@modules/provisioning/schulconnex-group-removal-amqp.app.module';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { install as sourceMapInstall } from 'source-map-support';

async function bootstrap(): Promise<void> {
	sourceMapInstall();

	const internalServerExpress = express();
	const internalServerExpressAdapter = new ExpressAdapter(internalServerExpress);

	const nestApp = await NestFactory.create(SchulconnexGroupRemovalAMQPModule, internalServerExpressAdapter);
	await nestApp.init();

	const port = 4454;
	const rootExpress = express();
	rootExpress.use('/internal', internalServerExpress);
	rootExpress.listen(port);

	console.log('##########################################################');
	console.log(`### Start Schulconnex Group Removal AMQP Consumer ###`);
	console.log('##########################################################');
}
void bootstrap();
