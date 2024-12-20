import { MediaSchoolLicense } from '../domain';

export interface MediaSchoolLicenseRepo {
	findMediaSchoolLicensesByMediumId(mediumId: string): Promise<MediaSchoolLicense[]>;

	save(domainObject: MediaSchoolLicense): Promise<MediaSchoolLicense>;

	delete(domainObjects: MediaSchoolLicense[] | MediaSchoolLicense): Promise<void>;
}

export const MEDIA_SCHOOL_LICENSE_REPO = 'MEDIA_SCHOOL_LICENSE_REPO';
