/* istanbul ignore file */
/* eslint-disable no-console */
import { SchulconnexGroupProvisioningAMQPModule } from '@modules/provisioning/schulconnex-group-provisioning-amqp.app.module';
import { NestFactory } from '@nestjs/core';
import { install as sourceMapInstall } from 'source-map-support';

async function bootstrap(): Promise<void> {
	sourceMapInstall();

	const nestApp = await NestFactory.create(SchulconnexGroupProvisioningAMQPModule);
	await nestApp.init();

	console.log('##########################################################');
	console.log(`### Start Schulconnex Group Provisioning AMQP Consumer ###`);
	console.log('##########################################################');
}
void bootstrap();
