import { groupEntityFactory } from '@modules/group/testing';
import { mediaSourceEntityFactory } from '@modules/media-source/testing';
import { BaseFactory } from '@testing/factory/base.factory';
import { MediaGroupLicenseEntity, type MediaGroupLicenseEntityProps } from '../entity';
import { GroupLicenseType } from '../enum';

export const mediaGroupLicenseEntityFactory = BaseFactory.define<MediaGroupLicenseEntity, MediaGroupLicenseEntityProps>(
	MediaGroupLicenseEntity,
	({ sequence }) => {
		return {
			group: groupEntityFactory.buildWithId(),
			type: GroupLicenseType.MEDIA_LICENSE,
			mediumId: `medium-${sequence}`,
			mediaSource: mediaSourceEntityFactory.buildWithId(),
		};
	}
);
