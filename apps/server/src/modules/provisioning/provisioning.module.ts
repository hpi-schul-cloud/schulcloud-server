import { Module } from '@nestjs/common';
import { Logger, LoggerModule } from '@src/core/logger';
import { SchoolModule } from '@src/modules/school/school.module';
import { RoleModule } from '@src/modules/role/role.module';
import { SystemModule } from '@src/modules/system/system.module';
import { RoleRepo, SchoolRepo } from '@shared/repo';
import { PermissionService } from '@shared/domain';
import { SanisProvisioningStrategy } from '@src/modules/provisioning/strategy/sanis/sanis.strategy';
import { SanisResponseMapper } from '@src/modules/provisioning/strategy/sanis/sanis-response.mapper';
import { HttpModule } from '@nestjs/axios';
import { IservProvisioningStrategy } from '@src/modules/provisioning/strategy/iserv/iserv.strategy';
import { UserDORepo } from '@shared/repo/user/user-do.repo';
import { AccountModule } from '@src/modules/account/account.module';
import { UserModule } from '@src/modules/user/user.module';
import { SanisSchoolService } from '@src/modules/provisioning/strategy/sanis/service/sanis-school.service';
import { SanisUserService } from '@src/modules/provisioning/strategy/sanis/service/sanis-user.service';
import { ProvisioningService } from './service/provisioning.service';

@Module({
	imports: [AccountModule, SchoolModule, UserModule, RoleModule, SystemModule, LoggerModule, HttpModule],
	controllers: [],
	providers: [
		ProvisioningService,
		SanisProvisioningStrategy,
		SanisSchoolService,
		SanisUserService,
		IservProvisioningStrategy,
		Logger,
		SanisResponseMapper,
		SchoolRepo,
		UserDORepo,
		RoleRepo,
		PermissionService,
	],
	exports: [ProvisioningService],
})
export class ProvisioningModule {}
