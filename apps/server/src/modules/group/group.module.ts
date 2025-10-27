import { forwardRef, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SchoolModule } from '@modules/school';
import { RoleModule } from '../role';
import { UserModule } from '../user';
import { GroupRepo } from './repo';
import { GroupService } from './service';
import { LoggerModule } from '@core/logger';
import { UserChangedSchoolGroupHandlerService } from '@modules/group/service/user-changed-school-group-handler.service';

@Module({
	imports: [forwardRef(() => UserModule), RoleModule, CqrsModule, LoggerModule, SchoolModule],
	providers: [GroupRepo, GroupService, UserChangedSchoolGroupHandlerService],
	exports: [GroupService],
})
export class GroupModule {}
