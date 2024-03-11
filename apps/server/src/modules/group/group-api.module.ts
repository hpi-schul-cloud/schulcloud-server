import { AuthorizationModule } from '@modules/authorization';
import { ClassModule } from '@modules/class';
import { LegacySchoolModule } from '@modules/legacy-school';
import { RoleModule } from '@modules/role';
import { SchoolModule } from '@modules/school';
import { SystemModule } from '@modules/system';
import { UserModule } from '@modules/user/user.module';
import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { GroupController } from './controller';
import { GroupModule } from './group.module';
import { GroupUc } from './uc';

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
	],
	controllers: [GroupController],
	providers: [GroupUc],
})
export class GroupApiModule {}
