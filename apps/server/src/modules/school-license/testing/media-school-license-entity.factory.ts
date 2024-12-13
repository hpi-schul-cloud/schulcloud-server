import { BaseFactory, schoolEntityFactory, userFactory } from '@shared/testing';
import { mediaSourceEntityFactory } from '@src/modules/media-source/testing/media-source-entity.factory';
import { MediaSchoolLicenseEntity } from '../entity';
import { SchoolLicenseType } from '../enum';
import { MediaSchoolLicenseEntityProps } from '../entity/media-school-license.entity';

export const mediaSchoolLicenseEntityFactory = BaseFactory.define<
	MediaSchoolLicenseEntity,
	MediaSchoolLicenseEntityProps
>(MediaSchoolLicenseEntity, ({ sequence }) => {
	return {
		school: schoolEntityFactory.build(),
		type: SchoolLicenseType.MEDIA_LICENSE,
		mediumId: `medium-${sequence}`,
		mediaSource: mediaSourceEntityFactory.buildWithId(),
	};
});
