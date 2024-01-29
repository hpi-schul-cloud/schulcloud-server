import { AuthorizationModule } from '@modules/authorization';
import { SystemModule } from '@modules/system';
import { Module } from '@nestjs/common';
import { SchoolController } from './controller';
import { AdminApiSchoolsController } from './controller/admin-api-schools.controller';
import { LegacySchoolModule } from './legacy-school.module';
import { SchoolSystemOptionsUc } from './uc';
import { AdminApiSchoolUc } from './uc/admin-api-schools.uc';

@Module({
	imports: [LegacySchoolModule, AuthorizationModule, SystemModule],
	controllers: [SchoolController, AdminApiSchoolsController],
	providers: [SchoolSystemOptionsUc, AdminApiSchoolUc],
})
export class LegacySchoolApiModule {}
