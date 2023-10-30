import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@src/core/logger';
import { BatchDeletionModule } from '@modules/batch-deletion/batch-deletion.module';
import { BatchDeletionAppStartupLoggable } from './loggables/batch-deletion-app-startup.loggable';

async function bootstrap() {
	const app = await NestFactory.createApplicationContext(BatchDeletionModule);

	const logger = await app.resolve(Logger);
	const configService = app.get(ConfigService);

	const inputFilePath = configService.get<string>('DELETION_INPUT_FILE_PATH') as string;

	logger.info(new BatchDeletionAppStartupLoggable({ inputFilePath }));
}

void bootstrap();
