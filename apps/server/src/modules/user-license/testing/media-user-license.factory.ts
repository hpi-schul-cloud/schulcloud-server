import { ObjectId } from '@mikro-orm/mongodb';
import { mediaSourceFactory } from '@modules/media-source/testing';
import { BaseFactory } from '@testing/factory/base.factory';
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
