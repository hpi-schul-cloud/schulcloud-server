import { type EntityId } from '@shared/domain/types';
import { Scope } from '@shared/repo/scope';
import { type MediaSchoolLicenseEntity } from '../../entity';
import { type SchoolLicenseType } from '../../enum';

export class MediaSchoolLicenseScope extends Scope<MediaSchoolLicenseEntity> {
	public bySchoolId(schoolId: EntityId | undefined): this {
		if (schoolId) {
			this.addQuery({ school: schoolId });
		}
		return this;
	}

	public bySchoolLicenseType(licenseType: SchoolLicenseType | undefined): this {
		if (licenseType) {
			this.addQuery({ type: licenseType });
		}
		return this;
	}
}
