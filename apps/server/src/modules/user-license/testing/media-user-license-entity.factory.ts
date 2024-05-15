import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory, userFactory } from '@shared/testing/factory';
import { MediaUserLicenseEntity, MediaUserLicenseEntityProps, UserLicenseType } from '../entity';

export const mediaUserLicenseEntityFactory = BaseFactory.define<MediaUserLicenseEntity, MediaUserLicenseEntityProps>(
	MediaUserLicenseEntity,
	({ sequence }) => {
		return {
			id: new ObjectId().toHexString(),
			user: userFactory.build(),
			type: UserLicenseType.MEDIA_LICENSE,
			mediumId: `medium-${sequence}`,
			mediaSourceId: `media-source-${sequence}`,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
);
