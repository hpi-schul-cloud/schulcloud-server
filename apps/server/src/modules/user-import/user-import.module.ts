import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '@src/modules/authorization';
import { ImportUserRepo, UserRepo } from '@shared/repo';
import { ImportUserController } from './controller/import-user.controller';
import { UserImportUc } from './uc/user-import.uc';
import { ImportUserAuthorizationService } from './services/import-user.authorization.service';

@Module({
	imports: [AuthorizationModule, LoggerModule],
	controllers: [ImportUserController],
	providers: [UserImportUc, ImportUserRepo, ImportUserAuthorizationService, UserRepo],
	exports: [],
})
/**
 * Module to provide user migration,
 * to link existing users with ldap references to enable
 * external authentication and sync.
 */
export class ImportUserModule {}
