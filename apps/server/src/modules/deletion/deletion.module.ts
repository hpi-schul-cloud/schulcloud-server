import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { DeletionRequestService } from './services/deletion-request.service';
import { DeletionRequestRepo } from './repo/deletion-request.repo';

@Module({
	imports: [LoggerModule],
	providers: [DeletionRequestService, DeletionRequestRepo],
	exports: [DeletionRequestService],
})
export class DeletionModule {}
