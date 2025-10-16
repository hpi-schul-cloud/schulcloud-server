import { EntityId } from '@shared/domain/types';
import { MediaSchoolLicense } from '../domain';

export interface MediaSchoolLicenseRepo {
	saveAll(domainObjects: MediaSchoolLicense[]): Promise<MediaSchoolLicense[]>;

	deleteAllByMediaSource(mediaSourceId: EntityId): Promise<number>;

	findMediaSchoolLicensesBySchoolId(schoolId: string): Promise<MediaSchoolLicense[]>;

	deleteAllBySchoolAndMediaSource(schoolId: EntityId, mediaSourceId: EntityId): Promise<number>;
}

export const MEDIA_SCHOOL_LICENSE_REPO = 'MEDIA_SCHOOL_LICENSE_REPO';
