import { EntityId } from '@shared/domain/types';
import { MediaSchoolLicense } from '../domain';

export interface MediaSchoolLicenseRepo {
	findAllByMediaSourceAndMediumId(mediaSourceId: EntityId, mediumId: string): Promise<MediaSchoolLicense[]>;

	save(domainObject: MediaSchoolLicense): Promise<MediaSchoolLicense>;

	delete(domainObjects: MediaSchoolLicense[] | MediaSchoolLicense): Promise<void>;

	findMediaSchoolLicensesBySchoolId(schoolId: string): Promise<MediaSchoolLicense[]>;
}

export const MEDIA_SCHOOL_LICENSE_REPO = 'MEDIA_SCHOOL_LICENSE_REPO';
