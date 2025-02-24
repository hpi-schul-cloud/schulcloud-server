import { AuthorizationService } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { MediaSchoolLicense } from '../domain';
import { MediaSchoolLicenseService } from '../service';

@Injectable()
export class MediaSchoolLicenseUc {
	constructor(
		private readonly mediaSchoolLicenseService: MediaSchoolLicenseService,
		private readonly authorizationService: AuthorizationService
	) {}

	public async updateMediaSchoolLicenses(currentUserId: string, schoolId: EntityId): Promise<void> {
		const user = await this.authorizationService.getUserWithPermissions(currentUserId);

		this.authorizationService.checkAllPermissions(user, [Permission.MEDIA_SCHOOL_LICENSE_ADMIN]);

		await this.mediaSchoolLicenseService.updateMediaSchoolLicenses(schoolId);
	}

	public async getMediaSchoolLicensesForSchool(
		currentUserId: string,
		schoolId: EntityId
	): Promise<MediaSchoolLicense[]> {
		const user = await this.authorizationService.getUserWithPermissions(currentUserId);

		this.authorizationService.checkAllPermissions(user, [Permission.MEDIA_SCHOOL_LICENSE_ADMIN]);

		const licenses = await this.mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId(schoolId);

		return licenses;
	}
}
