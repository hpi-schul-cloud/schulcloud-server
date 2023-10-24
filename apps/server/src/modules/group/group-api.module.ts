import { Module } from '@nestjs/common';
import { AuthorizationModule } from '@src/modules/authorization';
import { ClassModule } from '@src/modules/class';
import { RoleModule } from '@src/modules/role';
import { LegacySchoolModule } from '@src/modules/legacy-school';
import { SystemModule } from '@src/modules/system';
import { UserModule } from '@src/modules/user';
import { GroupController } from './controller';
import { GroupModule } from './group.module';
import { GroupUc } from './uc';

@Module({
	imports: [GroupModule, ClassModule, UserModule, RoleModule, LegacySchoolModule, AuthorizationModule, SystemModule],
	controllers: [GroupController],
	providers: [GroupUc],
})
export class GroupApiModule {}
