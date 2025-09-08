import { mediaSourceEntityFactory } from '@modules/media-source/testing';
import { userFactory } from '@modules/user/testing';
import { BaseFactory } from '@testing/factory/base.factory';
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
