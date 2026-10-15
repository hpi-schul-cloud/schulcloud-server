import { ObjectId } from '@mikro-orm/mongodb';
import { mediaSourceFactory } from '@modules/media-source/testing';
import { BaseFactory } from '@testing/factory/base.factory';
import { MediaGroupLicense, type MediaGroupLicenseProps } from '../domain';
import { GroupLicenseType } from '../enum';

export const mediaGroupLicenseFactory = BaseFactory.define<MediaGroupLicense, MediaGroupLicenseProps>(
	MediaGroupLicense,
	({ sequence }) => {
		return {
			id: new ObjectId().toHexString(),
			groupId: new ObjectId().toHexString(),
			type: GroupLicenseType.MEDIA_LICENSE,
			mediumId: `medium-${sequence}`,
			mediaSource: mediaSourceFactory.build(),
		};
	}
);
