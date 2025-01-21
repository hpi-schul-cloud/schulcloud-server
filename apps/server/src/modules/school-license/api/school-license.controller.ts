import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MediaSchoolLicenseUc } from '../uc';

@ApiTags('School License')
@JwtAuthentication()
@Controller('school-licenses')
export class SchoolLicenseController {
	constructor(private readonly mediaSchoolLicenseUc: MediaSchoolLicenseUc) {}

	@ApiOperation({ summary: 'Update media school licenses' })
	@Post()
	async updateMediaSchoolLicenses(@CurrentUser() currentUser: ICurrentUser): Promise<void> {
		await this.mediaSchoolLicenseUc.updateMediaSchoolLicenses(currentUser.userId, currentUser.schoolId);
	}
}
