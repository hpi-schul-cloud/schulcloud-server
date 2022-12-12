import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { ImportUserRepo, SchoolRepo, SystemRepo, UserRepo } from '@shared/repo';
import { PermissionService } from '@shared/domain';
import { ImportUserController } from './controller/import-user.controller';
import { UserImportUc } from './uc/user-import.uc';
import { AccountModule } from '../account/account.module';
import { SchoolModule, SchoolService } from '../school';

@Module({
	imports: [LoggerModule, AccountModule, SchoolModule],
	controllers: [ImportUserController],
	providers: [UserImportUc, ImportUserRepo, PermissionService, SchoolService, SystemRepo, UserRepo],
	exports: [],
})
/**
 * Module to provide user migration,
 * to link existing users with ldap references to enable
 * external authentication and sync.
 */
export class ImportUserModule {}
