import { NestFactory } from '@nestjs/core';
import { ConsoleModule } from './console.module';

async function bootstrap() {
	const app = await NestFactory.create(ConsoleModule);
	await app.listen(3333);
}
void bootstrap();
