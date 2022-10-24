import { Module } from '@nestjs/common';
import { PermissionService } from '@shared/domain';
import { UserRepo } from '@shared/repo';
import { Logger, LoggerModule } from '@src/core/logger';
import { PlaceholderResponseMapper } from '@src/modules/provisioning/strategy/placeholder/placeholder-response.mapper';
import { PlaceholderProvisioningStrategy } from '@src/modules/provisioning/strategy/placeholder/placeholder.strategy';
import { ProvisioningUc } from '@src/modules/provisioning/uc/provisioning.uc';
import { RoleModule } from '@src/modules/role/role.module';
import { RoleUc } from '@src/modules/role/uc/role.uc';
import { SchoolModule } from '@src/modules/school/school.module';
import { SchoolUc } from '@src/modules/school/uc/school.uc';
import { SystemModule } from '@src/modules/system/system.module';
import { SystemUc } from '@src/modules/system/uc/system.uc';
import { UserModule } from '@src/modules/user';
import { UserUc } from '@src/modules/user/uc';

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
