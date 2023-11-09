import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { ConfigService } from '@nestjs/config';
import { DeletionRequestService } from './services/deletion-request.service';
import { DeletionRequestRepo } from './repo/deletion-request.repo';
import { AuthenticationModule } from '../authentication';
import { DeletionRequestsController } from './controller/deletion-requests.controller';
import { DeletionExecutionsController } from './controller/deletion-executions.controller';
import { IXApiKeyConfig } from '../authentication/config/x-api-key.config';

@Module({
	imports: [LoggerModule, AuthenticationModule],
	controllers: [DeletionRequestsController, DeletionExecutionsController],
	providers: [DeletionRequestService, DeletionRequestRepo, ConfigService<IXApiKeyConfig, true>],
	exports: [DeletionRequestService],
})
export class DeletionModule {}
