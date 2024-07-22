import { Module } from '@nestjs/common';
import { AdminApiSchoolsController } from './controller/admin-api-schools.controller';
import { LegacySchoolModule } from './legacy-school.module';
import { AdminApiSchoolUc } from './uc/admin-api-schools.uc';

@Module({
	imports: [LegacySchoolModule],
	controllers: [AdminApiSchoolsController],
	providers: [AdminApiSchoolUc],
})
export class LegacySchoolAdminApiModule {}
