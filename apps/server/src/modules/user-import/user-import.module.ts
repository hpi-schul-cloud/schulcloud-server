import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { ImportUserRepo, SchoolRepo, UserRepo } from '@shared/repo';
import { PermissionService } from '@shared/domain';
import { ImportUserController } from './controller/import-user.controller';
import { UserImportUc } from './uc/user-import.uc';

@Module({
	imports: [LoggerModule],
	controllers: [ImportUserController],
	providers: [UserImportUc, ImportUserRepo, UserRepo, PermissionService, SchoolRepo],
	exports: [],
})
/**
 * Module to provide user migration,
 * to link existing users with ldap references to enable
 * external authentication and sync.
 */
export class ImportUserModule {}
