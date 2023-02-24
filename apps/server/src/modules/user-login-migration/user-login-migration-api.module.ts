import { Module } from '@nestjs/common';
import { UserMigrationController } from './controller/user-migration.controller';
import { PageContentMapper } from './mapper/page-content.mapper';
import { UserLoginMigrationModule } from './user-login-migration.module';
import { MigrationUc } from './uc/migration.uc';

@Module({
	imports: [UserLoginMigrationModule],
	providers: [MigrationUc, PageContentMapper],
	controllers: [UserMigrationController],
})
export class UserLoginMigrationApiModule {}
