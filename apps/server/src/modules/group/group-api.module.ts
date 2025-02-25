import { LoggerModule } from '@core/logger';
import { AuthorizationModule } from '@modules/authorization';
import { ClassModule } from '@modules/class';
import { CourseModule } from '@modules/course';
import { LegacySchoolModule } from '@modules/legacy-school';
import { RoleModule } from '@modules/role';
import { SchoolModule } from '@modules/school';
import { SystemModule } from '@modules/system';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { GroupController } from './controller';
import { GroupModule } from './group.module';
import { ClassGroupUc, GroupUc } from './uc';

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
	],
	controllers: [GroupController],
	providers: [GroupUc, ClassGroupUc],
})
export class GroupApiModule {}
