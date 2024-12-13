import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { mediaSourceFactory } from '@src/modules/media-source/testing/media-source.factory';
import { MediaUserLicense, MediaUserLicenseProps } from '../domain';
import { UserLicenseType } from '../entity';

export const mediaUserLicenseFactory = BaseFactory.define<MediaUserLicense, MediaUserLicenseProps>(
	MediaUserLicense,
	({ sequence }) => {
		return {
			id: new ObjectId().toHexString(),
			userId: new ObjectId().toHexString(),
			type: UserLicenseType.MEDIA_LICENSE,
			mediumId: `medium-${sequence}`,
			mediaSource: mediaSourceFactory.build(),
		};
	}
);
