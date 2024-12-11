import { BaseFactory, userFactory } from '@shared/testing';
import { mediaSourceEntityFactory } from '@src/modules/mediasource/testing/media-source-entity.factory';
import { MediaUserLicenseEntity, MediaUserLicenseEntityProps, UserLicenseType } from '../entity';

export const mediaUserLicenseEntityFactory = BaseFactory.define<MediaUserLicenseEntity, MediaUserLicenseEntityProps>(
	MediaUserLicenseEntity,
	({ sequence }) => {
		return {
			user: userFactory.build(),
			type: UserLicenseType.MEDIA_LICENSE,
			mediumId: `medium-${sequence}`,
			mediaSource: mediaSourceEntityFactory.buildWithId(),
		};
	}
);
