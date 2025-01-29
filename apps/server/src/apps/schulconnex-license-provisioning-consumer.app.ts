/* istanbul ignore file */
/* eslint-disable no-console */
import { SchulconnexLicenseProvisioningAMQPModule } from '@modules/provisioning/schulconnex-license-provisioning-amqp.app.module';
import { NestFactory } from '@nestjs/core';
import { install as sourceMapInstall } from 'source-map-support';

async function bootstrap(): Promise<void> {
	sourceMapInstall();

	const nestApp = await NestFactory.create(SchulconnexLicenseProvisioningAMQPModule);
	await nestApp.init();

	console.log('############################################################');
	console.log(`### Start Schulconnex License Provisioning AMQP Consumer ###`);
	console.log('############################################################');
}
void bootstrap();
