import { Module } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { DeletionRequestService } from './services/deletion-request.service';
import { DeletionRequestRepo } from './repo/deletion-request.repo';

@Module({
	providers: [Logger, DeletionRequestService, DeletionRequestRepo],
	exports: [DeletionRequestService],
})
export class DeletionModule {}
