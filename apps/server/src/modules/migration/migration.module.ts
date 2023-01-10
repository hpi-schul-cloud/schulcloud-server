import { Module } from '@nestjs/common';
import { SystemRepo } from '@shared/repo';
import { LoggerModule } from '../../core/logger';
import { MigrationController } from './controller/migration.controller';
import { MigrationService } from './service/migration.service';
import { SystemModule } from '../system';
import { PageContentMapper } from './mapper/page-content.mapper';

@Module({
	imports: [LoggerModule, SystemModule],
	providers: [SystemRepo, MigrationService],
	exports: [MigrationService],
})
export class MigrationModule {}

@Module({
	imports: [MigrationModule],
	providers: [PageContentMapper],
	controllers: [MigrationController],
})
export class MigrationApiModule {}
