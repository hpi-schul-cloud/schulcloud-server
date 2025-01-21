import { Injectable } from '@nestjs/common';
import { User } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { AuthorizationService } from '../../authorization';
import { SchoolService } from '../../school';
import { MediaSchoolLicenseService } from '../service';

@Injectable()
export class MediaSchoolLicenseUc {
	constructor(
		private readonly mediaSchoolLicenseService: MediaSchoolLicenseService,
		private readonly authorizationService: AuthorizationService,
		private readonly schoolService: SchoolService
	) {}

	public async updateMediaSchoolLicenses(currentUserId: string, schoolId: EntityId): Promise<void> {
		const user: User = await this.authorizationService.getUserWithPermissions(currentUserId);
		// TODO permission check
		this.authorizationService.checkAllPermissions(user, []);

		await this.mediaSchoolLicenseService.updateMediaSchoolLicenses(schoolId);
	}
}
