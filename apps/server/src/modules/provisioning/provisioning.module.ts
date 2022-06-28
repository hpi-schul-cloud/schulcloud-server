import { Module } from '@nestjs/common';
import { Logger, LoggerModule } from '@src/core/logger';
import { ProvisioningUc } from '@src/modules/provisioning/uc/provisioning.uc';
import { UserUc } from '@src/modules/user/uc';
import { SchoolUc } from '@src/modules/school/uc/school.uc';
import { RoleUc } from '@src/modules/role/uc/role.uc';
import { SystemUc } from '@src/modules/system/uc/system.uc';
import { UnknownProvisioningStrategy } from '@src/modules/provisioning/strategy/unknown/unknown.strategy';
import { UserModule } from '@src/modules';
import { SchoolModule } from '@src/modules/school/school.module';
import { RoleModule } from '@src/modules/role/role.module';
import { SystemModule } from '@src/modules/system/system.module';
import { UnknownResponseMapper } from '@src/modules/provisioning/strategy/unknown/unknown-response.mapper';

@Module({
	imports: [UserModule, SchoolModule, RoleModule, SystemModule, LoggerModule],
	controllers: [],
	providers: [
		ProvisioningUc,
		UserUc,
		SchoolUc,
		RoleUc,
		SystemUc,
		UnknownProvisioningStrategy,
		Logger,
		UnknownResponseMapper,
	],
	exports: [ProvisioningUc],
})
export class ProvisioningModule {}
