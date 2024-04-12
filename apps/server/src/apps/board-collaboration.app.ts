/* istanbul ignore file */
/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';

// import { ServerModule } from '@modules/server';

// register source-map-support for debugging
import { install as sourceMapInstall } from 'source-map-support';

// application imports
// import { SwaggerDocumentOptions } from '@nestjs/swagger';
import { LegacyLogger } from '@src/core/logger';
// import { BoardModule } from '@src/modules/board';
import { BoardCollaborationModule } from '@src/modules/board/board-collaboration.module';
// import { enableOpenApiDocs } from '@src/shared/controller/swagger';

async function bootstrap() {
	sourceMapInstall();

	const nestApp = await NestFactory.create(BoardCollaborationModule);

	// WinstonLogger
	nestApp.useLogger(await nestApp.resolve(LegacyLogger));

	// customize nest app settings
	nestApp.enableCors({ exposedHeaders: ['Content-Disposition'] });

	// const options: SwaggerDocumentOptions = {
	// 	operationIdFactory: (_controllerKey: string, methodKey: string) => methodKey,
	// };
	// enableOpenApiDocs(nestApp, 'docs', options);

	// await nestApp.init();

	const port = 4450;
	const basePath = '/api/v3';

	nestApp.setGlobalPrefix(basePath);
	await nestApp.listen(port);

	console.log('##########################################');
	console.log(`### Start Board Collaboration Server   ###`);
	console.log(`### Port:      ${port}                     ###`);
	console.log(`### Base path: ${basePath}             ###`);
	console.log('##########################################');
}
void bootstrap();
