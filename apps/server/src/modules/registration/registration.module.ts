import { LoggerModule } from '@core/logger/logger.module';
import { ConfigurationModule } from '@infra/configuration';
import { AccountModule } from '@modules/account';
import { RoleService } from '@modules/role';
import { RoleRepo } from '@modules/role/repo';
import { RoomModule } from '@modules/room';
import { RoomMembershipModule } from '@modules/room-membership';
import { SchoolModule } from '@modules/school';
import { ServerMailModule } from '@modules/serverDynamicModuleWrappers/server-mail.module';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { RegistrationService } from './domain';
import { RegistrationRepo } from './repo';
import { REGISTRATION_CONFIG_TOKEN, RegistrationPublicApiConfig } from './registration.config';

@Module({
	imports: [
		AccountModule,
		RoomModule,
		RoomMembershipModule,
		SchoolModule,
		ServerMailModule,
		UserModule,
		LoggerModule,
		ConfigurationModule.register(REGISTRATION_CONFIG_TOKEN, RegistrationPublicApiConfig),
	],
	providers: [RegistrationRepo, RegistrationService, RoleService, RoleRepo],
	exports: [RegistrationService],
})
export class RegistrationModule {}
