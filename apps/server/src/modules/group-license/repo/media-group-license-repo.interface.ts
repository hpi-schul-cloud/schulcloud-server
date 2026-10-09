import { type EntityId } from '@shared/domain/types';
import { type MediaGroupLicense } from '../domain';

export interface MediaGroupLicenseRepo {
	saveAll(licenses: MediaGroupLicense[]): Promise<MediaGroupLicense[]>;
	delete(licenses: MediaGroupLicense[] | MediaGroupLicense): Promise<void>;
	findMediaGroupLicensesByGroupIds(groupIds: EntityId[]): Promise<MediaGroupLicense[]>;
	findMediaGroupLicensesByGroupId(groupId: EntityId): Promise<MediaGroupLicense[]>;
}

export const MEDIA_GROUP_LICENSE_REPO = 'MEDIA_GROUP_LICENSE_REPO';
