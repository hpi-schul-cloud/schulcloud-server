import { Module } from '@nestjs/common';
import { IdentityManagementModule } from '@shared/infra/identity-management/identity-management.module';
import { SystemRepo } from '@shared/repo';
import { SystemController } from '@src/modules/system/controller/system.controller';
import { SystemService } from '@src/modules/system/service/system.service';
import { SystemUc } from '@src/modules/system/uc/system.uc';
import { SystemOidcService } from './service/system-oidc.service';

@Module({
	imports: [IdentityManagementModule],
	providers: [SystemRepo, SystemService, SystemOidcService, SystemUc],
	controllers: [SystemController],
	exports: [SystemService, SystemOidcService, SystemUc],
})
export class SystemModule {}
