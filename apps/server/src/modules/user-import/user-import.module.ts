import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { AccountRepo, ImportUserRepo, SchoolRepo, UserRepo } from '@shared/repo';
import { PermissionService } from '@shared/domain';
import { ImportUserController } from './controller/import-user.controller';
import { UserImportUc } from './uc/user-import.uc';

@Module({
	imports: [LoggerModule],
	controllers: [ImportUserController],
	providers: [AccountRepo, UserImportUc, ImportUserRepo, PermissionService, SchoolRepo, UserRepo],
	exports: [],
})
/**
 * Module to provide user migration,
 * to link existing users with ldap references to enable
 * external authentication and sync.
 */
export class ImportUserModule {}
