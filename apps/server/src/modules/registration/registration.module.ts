import { AccountModule } from '@modules/account';
import { RoleService } from '@modules/role';
import { RoleRepo } from '@modules/role/repo';
import { RoomMembershipModule } from '@modules/room-membership';
import { SchoolModule } from '@modules/school';
import { ServerMailModule } from '@modules/serverDynamicModuleWrappers/server-mail.module';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { RegistrationService } from './domain';
import { RegistrationRepo } from './repo';

@Module({
	imports: [AccountModule, RoomMembershipModule, SchoolModule, ServerMailModule, UserModule],
	providers: [RegistrationRepo, RegistrationService, RoleService, RoleRepo],
	exports: [RegistrationService],
})
export class RegistrationModule {}
