import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization/authorization.module';
import { ClassModule } from '../class/class.module';
import { LegacySchoolModule } from '../legacy-school/legacy-school.module';
import { RoleModule } from '../role/role.module';
import { SystemModule } from '../system/system.module';
import { UserModule } from '../user/user.module';
import { GroupController } from './controller/group.controller';
import { GroupModule } from './group.module';
import { GroupUc } from './uc/group.uc';

@Module({
	imports: [GroupModule, ClassModule, UserModule, RoleModule, LegacySchoolModule, AuthorizationModule, SystemModule],
	controllers: [GroupController],
	providers: [GroupUc],
})
export class GroupApiModule {}
