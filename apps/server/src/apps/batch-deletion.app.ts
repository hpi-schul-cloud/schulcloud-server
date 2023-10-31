import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@src/core/logger';
import { BatchDeletionModule } from '@modules/batch-deletion/batch-deletion.module';
import { BatchDeletionAppStartupLoggable } from './loggables/batch-deletion-app-startup.loggable';

async function bootstrap() {
	const app = await NestFactory.createApplicationContext(BatchDeletionModule);

	const logger = await app.resolve(Logger);
	const configService = app.get(ConfigService);

	const targetRefDomain = configService.get<string>('TARGET_REF_DOMAIN') as string;
	const targetRefsFilePath = configService.get<string>('TARGET_REFS_FILE_PATH') as string;
	const deleteInMinutes = configService.get<number>('DELETE_IN_MINUTES') as number;

	logger.info(new BatchDeletionAppStartupLoggable({ targetRefDomain, targetRefsFilePath, deleteInMinutes }));
}

void bootstrap();
