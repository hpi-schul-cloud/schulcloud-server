import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Controller, Get, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { MediaSchoolLicense } from '../domain';
import { MediaSchoolLicenseUc } from '../uc';
import { MediaSchoolLicenseListResponse } from './dto';
import { MediaSchoolLicenseResponseMapper } from './mapper';

@ApiTags('School License')
@JwtAuthentication()
@Controller('school-licenses')
export class SchoolLicenseController {
	constructor(private readonly mediaSchoolLicenseUc: MediaSchoolLicenseUc) {}

	@ApiOperation({ summary: 'Update media school licenses' })
	@ApiCreatedResponse()
	@ApiUnauthorizedResponse()
	@Post()
	public async updateMediaSchoolLicenses(@CurrentUser() currentUser: ICurrentUser): Promise<void> {
		await this.mediaSchoolLicenseUc.updateMediaSchoolLicenses(currentUser.userId, currentUser.schoolId);
	}

	@ApiOperation({ summary: 'Get all active media licenses for a school' })
	@Get()
	public async getMediaSchoolLicensesForSchool(
		@CurrentUser() currentUser: ICurrentUser
	): Promise<MediaSchoolLicenseListResponse> {
		const licenses: MediaSchoolLicense[] = await this.mediaSchoolLicenseUc.getMediaSchoolLicensesForSchool(
			currentUser.userId,
			currentUser.schoolId
		);

		const response: MediaSchoolLicenseListResponse =
			MediaSchoolLicenseResponseMapper.mapMediaSchoolLicensesToListResponse(licenses);

		return response;
	}
}
