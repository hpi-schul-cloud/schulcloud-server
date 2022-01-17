import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '@src/modules/authorization';
import { ImportUserRepo } from '@shared/repo';
import { ImportUserController } from './controller/import-user.controller';
import { UserImportUC } from './uc/user-import.uc';
import { ImportUserAuthorizationService } from './provider/import-user.authorization.service';
import { UserRepo } from './repo/user.repo';
import { UserUC } from './uc/user.uc';

@Module({
	imports: [AuthorizationModule, LoggerModule],
	controllers: [ImportUserController],
	providers: [UserImportUC, ImportUserRepo, ImportUserAuthorizationService, UserRepo, UserUC],
	exports: [],
})
/**
 * Module to provide user migration,
 * to link existing users with ldap references to enable
 * external authentication and sync.
 */
export class ImportUserModule {}
