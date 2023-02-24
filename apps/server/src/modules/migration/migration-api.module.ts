import { Module } from '@nestjs/common';
import { UserMigrationController } from './controller/user-migration.controller';
import { PageContentMapper } from './mapper/page-content.mapper';
import { MigrationModule } from './migration.module';
import { MigrationUc } from './uc/migration.uc';

@Module({
	imports: [MigrationModule],
	providers: [MigrationUc, PageContentMapper],
	controllers: [UserMigrationController],
})
export class MigrationApiModule {}
