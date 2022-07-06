import { Module } from '@nestjs/common';
import { Logger, LoggerModule } from '@src/core/logger';
import { ProvisioningUc } from '@src/modules/provisioning/uc/provisioning.uc';
import { UserUc } from '@src/modules/user/uc';
import { SchoolUc } from '@src/modules/school/uc/school.uc';
import { RoleUc } from '@src/modules/role/uc/role.uc';
import { SystemUc } from '@src/modules/system/uc/system.uc';
import { UserModule } from '@src/modules';
import { SchoolModule } from '@src/modules/school/school.module';
import { RoleModule } from '@src/modules/role/role.module';
import { SystemModule } from '@src/modules/system/system.module';
import { PlaceholderResponseMapper } from '@src/modules/provisioning/strategy/placeholder/placeholder-response.mapper';
import { PlaceholderProvisioningStrategy } from '@src/modules/provisioning/strategy/placeholder/placeholder.strategy';
import { UserRepo } from '@shared/repo';
import { PermissionService } from '@shared/domain';

@Module({
	imports: [UserModule, SchoolModule, RoleModule, SystemModule, LoggerModule],
	controllers: [],
	providers: [
		ProvisioningUc,
		UserUc,
		SchoolUc,
		RoleUc,
		SystemUc,
		PlaceholderProvisioningStrategy,
		Logger,
		PlaceholderResponseMapper,
		UserRepo,
		PermissionService,
	],
	exports: [ProvisioningUc],
})
export class ProvisioningModule {}
