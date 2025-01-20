import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { MediaSchoolLicenseService } from '../service';

@Injectable()
export class MediaSchoolLicenseUc {
	constructor(private readonly mediaSchoolLicenseService: MediaSchoolLicenseService) {}

	public async updateMediaSchoolLicenses(schoolId: EntityId): Promise<void> {
		await this.mediaSchoolLicenseService.updateMediaSchoolLicenses(schoolId);
	}
}
