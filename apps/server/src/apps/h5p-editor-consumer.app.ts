/* istanbul ignore file */
/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { install as sourceMapInstall } from 'source-map-support';

// application imports
import { LegacyLogger } from '@core/logger';
import { H5PEditorAMQPModule } from '@modules/h5p-content-management';

async function bootstrap(): Promise<void> {
	sourceMapInstall();

	const internalServerExpress = express();
	const internalServerExpressAdapter = new ExpressAdapter(internalServerExpress);

	const nestApp = await NestFactory.create(H5PEditorAMQPModule, internalServerExpressAdapter);

	// WinstonLogger
	nestApp.useLogger(await nestApp.resolve(LegacyLogger));

	await nestApp.init();

	const port = 4449;
	const rootExpress = express();
	rootExpress.use('/internal', internalServerExpress);
	rootExpress.listen(port);

	console.log('##########################################');
	console.log(`### Start H5P Editor AMQP Consumer    ###`);
	console.log(`### Port:      ${port}                    ###`);
	console.log('##########################################');
}

void bootstrap();
