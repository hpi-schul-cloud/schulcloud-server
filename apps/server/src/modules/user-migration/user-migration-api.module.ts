import { Module } from '@nestjs/common';
import { UserMigrationController } from './controller/user-migration.controller';
import { PageContentMapper } from './mapper/page-content.mapper';
import { UserMigrationModule } from './user-migration.module';
import { UserMigrationUc } from './uc/user-migration.uc';

@Module({
	imports: [UserMigrationModule],
	providers: [UserMigrationUc, PageContentMapper],
	controllers: [UserMigrationController],
})
export class UserMigrationApiModule {}
