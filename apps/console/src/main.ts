/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { NestFactory } from '@nestjs/core';
import { ConsoleModule } from './console.module';

async function bootstrap() {
	const app = await NestFactory.create(ConsoleModule);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const server = await app.listen(3333);
	server.setTimeout(600000);
}
void bootstrap();
