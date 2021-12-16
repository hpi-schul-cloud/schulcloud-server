import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '@src/modules/authorization';
import { ImportUserRepo } from '@shared/repo';
import { ImportUserController } from './controller/import-user.controller';
import { UserImportUC } from './uc/user-import.uc';


@Module({
	imports: [
		AuthorizationModule,
		LoggerModule,
		// MikroOrmModule.forFeature({ entities: [ImportUser, System] })
	],
	controllers: [ImportUserController],
	providers: [UserImportUC, ImportUserRepo],
	exports: [],
})
/**
 * Module to provide user migration,
 * to link existing users with ldap references to enable
 * external authentication and sync.
 */
export class ImportUserModule {}
