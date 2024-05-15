import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing/factory';
import { MediaUserLicense } from '../domain';
import { MediaUserLicenseProps } from '../domain/media-user-license';
import { UserLicenseType } from '../entity';

export const mediaUserLicenseFactory = BaseFactory.define<MediaUserLicense, MediaUserLicenseProps>(
	MediaUserLicense,
	({ sequence }) => {
		return {
			id: new ObjectId().toHexString(),
			userId: new ObjectId().toHexString(),
			type: UserLicenseType.MEDIA_LICENSE,
			mediumId: `medium-${sequence}`,
			mediaSourceId: `media-source-${sequence}`,
		};
	}
);
