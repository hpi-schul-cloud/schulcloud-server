import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MediaSchoolLicenseUc } from '../uc/media-school-license.uc';

@ApiTags('SchoolLicense')
@JwtAuthentication()
@Controller('school-license')
export class SchoolLicenseController {
	constructor(private readonly mediaSchoolLicenseUc: MediaSchoolLicenseUc) {}

	@Post()
	async updateMediaSchoolLicenses(@CurrentUser() currentUser: ICurrentUser): Promise<void> {
		await this.mediaSchoolLicenseUc.updateMediaSchoolLicenses(currentUser.schoolId);
	}
}
