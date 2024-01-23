import { AuthorizationModule } from '@modules/authorization';
import { SystemModule } from '@modules/system';
import { Module } from '@nestjs/common';
import { SchoolController } from './controller';
import { AdminSchoolsController } from './controller/school-administration.controller';
import { LegacySchoolModule } from './legacy-school.module';
import { SchoolSystemOptionsUc } from './uc';
import { AdminApiSchoolUc } from './uc/school-admin.uc';

@Module({
	imports: [LegacySchoolModule, AuthorizationModule, SystemModule],
	controllers: [SchoolController, AdminSchoolsController],
	providers: [SchoolSystemOptionsUc, AdminApiSchoolUc],
})
export class LegacySchoolApiModule {}
