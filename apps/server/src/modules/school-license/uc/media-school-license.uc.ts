import { Injectable } from '@nestjs/common';
import { User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { AuthorizationService } from '@src/modules/authorization';
import { MediaSchoolLicenseService } from '../service';

@Injectable()
export class MediaSchoolLicenseUc {
	constructor(
		private readonly mediaSchoolLicenseService: MediaSchoolLicenseService,
		private readonly authorizationService: AuthorizationService
	) {}

	public async updateMediaSchoolLicenses(currentUserId: string, schoolId: EntityId): Promise<void> {
		const user: User = await this.authorizationService.getUserWithPermissions(currentUserId);

		this.authorizationService.checkAllPermissions(user, [Permission.MEDIA_SCHOOL_LICENSE_ADMIN]);

		await this.mediaSchoolLicenseService.updateMediaSchoolLicenses(schoolId);
	}
}
