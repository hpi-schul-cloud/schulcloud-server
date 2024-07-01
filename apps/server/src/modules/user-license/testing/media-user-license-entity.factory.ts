import { BaseFactory, userFactory } from '@shared/testing';
import { MediaUserLicenseEntity, MediaUserLicenseEntityProps, UserLicenseType } from '../entity';
import { mediaSourceEntityFactory } from './media-source-entity.factory';

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
