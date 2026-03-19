import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { UserChangedSchoolGroupHandlerService } from '@modules/group/service/user-changed-school-group-handler.service';
import { SchoolModule } from '@modules/school';
import { forwardRef, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { RoleModule } from '../role';
import { UserModule } from '../user';
import { GROUP_CONFIG_TOKEN, GroupConfig } from './group.config';
import { GroupRepo } from './repo';
import { GroupService } from './service';

@Module({
	imports: [
		forwardRef(() => UserModule),
		RoleModule,
		CqrsModule,
		LoggerModule,
		SchoolModule,
		ConfigurationModule.register(GROUP_CONFIG_TOKEN, GroupConfig),
	],
	providers: [GroupRepo, GroupService, UserChangedSchoolGroupHandlerService],
	exports: [GroupService],
})
export class GroupModule {}
