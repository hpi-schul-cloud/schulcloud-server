import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { ImportUserRepo, UserRepo } from '@shared/repo';
import { PermissionService } from '@shared/domain';
import { ImportUserController } from './controller/import-user.controller';
import { UserImportUc } from './uc/user-import.uc';

@Module({
	imports: [LoggerModule],
	controllers: [ImportUserController],
	providers: [UserImportUc, ImportUserRepo, UserRepo, PermissionService],
	exports: [],
})
/**
 * Module to provide user migration,
 * to link existing users with ldap references to enable
 * external authentication and sync.
 */
export class ImportUserModule {}
