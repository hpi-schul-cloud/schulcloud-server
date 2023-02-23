import { Module } from '@nestjs/common';
import { UserMigrationController } from './controller/user-migration.controller';
import { PageContentMapper } from './mapper/page-content.mapper';
import { MigrationModule } from './migration.module';
import { UserMigrationUc } from './uc/user-migration.uc';

@Module({
	imports: [MigrationModule],
	providers: [UserMigrationUc, PageContentMapper],
	controllers: [UserMigrationController],
})
export class MigrationApiModule {}
