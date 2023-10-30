import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '@src/core/logger';
import { createConfigModuleOptions } from '@src/config';
import { config } from './batch-deletion-config';

@Module({
	imports: [LoggerModule, ConfigModule.forRoot(createConfigModuleOptions(config))],
	providers: [],
})
export class BatchDeletionModule {}
