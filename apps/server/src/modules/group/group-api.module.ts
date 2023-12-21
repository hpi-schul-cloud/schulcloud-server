import { Module } from '@nestjs/common';
import { AuthorizationModule } from '@modules/authorization';
import { ClassModule } from '@modules/class';
import { RoleModule } from '@modules/role';
import { LegacySchoolModule } from '@modules/legacy-school';
import { SystemModule } from '@modules/system';
import { UserModule } from '@modules/user';
import { LoggerModule } from '@src/core/logger';
import { GroupController } from './controller';
import { GroupModule } from './group.module';
import { GroupUc } from './uc';
import { SchoolModule } from '../school';

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
