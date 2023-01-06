import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logger';
import { MigrationController } from './controller/migration.controller';

@Module({
	imports: [LoggerModule],
	controllers: [MigrationController],
})
export class MigrationModule {}
