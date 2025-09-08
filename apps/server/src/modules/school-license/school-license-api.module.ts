import { AuthorizationModule } from '@modules/authorization';
import { Module } from '@nestjs/common';
import { SchoolLicenseController } from './api/school-license.controller';
import { SchoolLicenseModule } from './school-license.module';
import { MediaSchoolLicenseUc } from './uc';

@Module({
	imports: [SchoolLicenseModule, AuthorizationModule],
	controllers: [SchoolLicenseController],
	providers: [MediaSchoolLicenseUc],
})
export class SchoolLicenseApiModule {}
