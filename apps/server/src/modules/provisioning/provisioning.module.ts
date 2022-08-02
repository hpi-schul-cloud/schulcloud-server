import { Module } from '@nestjs/common';
import { Logger, LoggerModule } from '@src/core/logger';
import { ProvisioningUc } from '@src/modules/provisioning/uc/provisioning.uc';
import { UserModule } from '@src/modules/user/user.module';
import { SchoolModule } from '@src/modules/school/school.module';
import { RoleModule } from '@src/modules/role/role.module';
import { SystemModule } from '@src/modules/system/system.module';
import { UserRepo } from '@shared/repo';
import { PermissionService } from '@shared/domain';
import {SanisProvisioningStrategy} from "@src/modules/provisioning/strategy/sanis/sanis.strategy";
import {SanisResponseMapper} from "@src/modules/provisioning/strategy/sanis/sanis-response.mapper";
import {HttpModule} from "@nestjs/axios";

@Module({
	imports: [UserModule, SchoolModule, RoleModule, SystemModule, LoggerModule, HttpModule],
	controllers: [],
	providers: [
		ProvisioningUc,
		SanisProvisioningStrategy,
		Logger,
		SanisResponseMapper,
		UserRepo,
		PermissionService,
	],
	exports: [ProvisioningUc],
})
export class ProvisioningModule {}
