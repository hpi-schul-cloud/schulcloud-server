import { AuthorizationModule } from '@modules/authorization';
import { ClassModule } from '@modules/class';
import { LearnroomModule } from '@modules/learnroom';
import { LegacySchoolModule } from '@modules/legacy-school';
import { RoleModule } from '@modules/role';
import { SchoolModule } from '@modules/school';
import { SystemModule } from '@modules/system';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
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
		LearnroomModule,
	],
	controllers: [GroupController],
	providers: [GroupUc, ClassGroupUc],
})
export class GroupApiModule {}
