import { Module } from '@nestjs/common';
import { IdentityManagementModule } from '@shared/infra/identity-management';
import { SystemRepo } from '@shared/repo';
import { SystemController } from '@src/modules/system/controller/system.controller';
import { SystemService } from '@src/modules/system/service/system.service';
import { SystemUc } from '@src/modules/system/uc/system.uc';

@Module({
	imports: [IdentityManagementModule],
	providers: [SystemRepo, SystemService, SystemUc],
	controllers: [SystemController],
	exports: [SystemService, SystemUc],
})
export class SystemModule {}
