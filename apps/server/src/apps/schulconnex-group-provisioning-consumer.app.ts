/* istanbul ignore file */
/* eslint-disable no-console */
import { SchulconnexGroupProvisioningAMQPModule } from '@modules/provisioning/schulconnex-group-provisioning-amqp.app.module';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { install as sourceMapInstall } from 'source-map-support';

async function bootstrap(): Promise<void> {
	sourceMapInstall();

	const internalServerExpress = express();
	const internalServerExpressAdapter = new ExpressAdapter(internalServerExpress);

	const nestApp = await NestFactory.create(SchulconnexGroupProvisioningAMQPModule, internalServerExpressAdapter);
	await nestApp.init();

	const port = 4450;
	const rootExpress = express();
	rootExpress.use('/internal', internalServerExpress);
	rootExpress.listen(port);

	console.log('##########################################################');
	console.log(`### Start Schulconnex Group Provisioning AMQP Consumer ###`);
	console.log('##########################################################');
}
void bootstrap();
