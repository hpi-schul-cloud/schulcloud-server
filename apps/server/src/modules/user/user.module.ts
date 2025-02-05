import { LoggerModule } from '@core/logger';
import { CalendarModule } from '@infra/calendar';
import { FilesStorageClientModule } from '@modules/files-storage-client';
import { RegistrationPinModule } from '@modules/registration-pin';
import { RoleModule } from '@modules/role';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { UserRepo } from '@shared/repo/user';
import { UserDORepo } from '@shared/repo/user/user-do.repo';
import { UserService } from './service';

@Module({
	imports: [RoleModule, LoggerModule, CqrsModule, RegistrationPinModule, CalendarModule, FilesStorageClientModule],
	providers: [UserRepo, UserDORepo, UserService],
	exports: [UserService, UserRepo],
})
export class UserModule {}
