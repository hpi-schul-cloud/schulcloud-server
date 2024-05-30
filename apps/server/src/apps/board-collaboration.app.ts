/* istanbul ignore file */
/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';

// register source-map-support for debugging
import { install as sourceMapInstall } from 'source-map-support';

// application imports
import { SwaggerDocumentOptions } from '@nestjs/swagger';
import { DB_URL } from '@src/config';
import { LegacyLogger } from '@src/core/logger';
import { MongoIoAdapter } from '@src/infra/socketio';
import { BoardCollaborationModule } from '@src/modules/board/board-collaboration.module';
import { enableOpenApiDocs } from '@src/shared/controller/swagger';

async function bootstrap() {
	sourceMapInstall();

	const nestApp = await NestFactory.create(BoardCollaborationModule);

	// WinstonLogger
	nestApp.useLogger(await nestApp.resolve(LegacyLogger));

	// customize nest app settings
	nestApp.enableCors({ exposedHeaders: ['Content-Disposition'] });

	const mongoIoAdapter = new MongoIoAdapter(nestApp);
	await mongoIoAdapter.connectToMongoDb(DB_URL);

	nestApp.useWebSocketAdapter(mongoIoAdapter);

	const options: SwaggerDocumentOptions = {
		operationIdFactory: (_controllerKey: string, methodKey: string) => methodKey,
	};
	enableOpenApiDocs(nestApp, 'docs', options);

	await nestApp.init();

	const port = 4450;
	const basePath = '/board-collaboration';

	nestApp.setGlobalPrefix(basePath);
	await nestApp.listen(port);

	console.log('##########################################');
	console.log(`### Start Board Collaboration Server   ###`);
	console.log(`### Port:      ${port}                     ###`);
	console.log(`### Base path: ${basePath}             ###`);
	console.log('##########################################');
}
void bootstrap();
