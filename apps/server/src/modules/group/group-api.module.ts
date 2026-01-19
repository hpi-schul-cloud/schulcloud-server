import { LoggerModule } from '@core/logger';
import { AuthorizationModule } from '@modules/authorization';
import { ClassModule } from '@modules/class';
import { CourseModule } from '@modules/course';
import { LegacySchoolModule } from '@modules/legacy-school';
import { RoleModule } from '@modules/role';
import { SagaModule } from '@modules/saga';
import { SchoolModule } from '@modules/school';
import { SystemModule } from '@modules/system';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { GroupController } from './controller';
import { GroupModule } from './group.module';
import { DeleteUserGroupDataStep } from './saga/delete-user-group-data.step';
import { ClassGroupUc, GroupUc } from './uc';
import { ConfigurationModule } from '@infra/configuration';
import { GROUP_CONFIG_TOKEN, GroupConfig } from './group.config';

@Module({
	imports: [
		GroupModule,
		ClassModule,
		UserModule,
		RoleModule,
		LegacySchoolModule,
		SchoolModule,
		AuthorizationModule,
		SystemModule,
		LoggerModule,
		CourseModule,
		SagaModule,
		ConfigurationModule.register(GROUP_CONFIG_TOKEN, GroupConfig),
	],
	controllers: [GroupController],
	providers: [GroupUc, ClassGroupUc, DeleteUserGroupDataStep],
})
export class GroupApiModule {}
