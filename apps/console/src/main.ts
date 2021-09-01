/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { NestFactory } from '@nestjs/core';
import { ConsoleModule } from './console.module';

async function bootstrap() {
	const app = await NestFactory.create(ConsoleModule);
	const server = await app.listen(3333);

	// extend timeout to one minute for long running tasks
	server.setTimeout(600000);
}
void bootstrap();
