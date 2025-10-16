import { ObjectId } from '@mikro-orm/mongodb';
import { mediaSourceEntityFactory } from '@modules/media-source/testing';
import { schoolEntityFactory } from '@modules/school/testing';
import { BaseFactory } from '@testing/factory/base.factory';
import { MediaSchoolLicenseEntity, MediaSchoolLicenseEntityProps } from '../entity';
import { SchoolLicenseType } from '../enum';

export const mediaSchoolLicenseEntityFactory = BaseFactory.define<
	MediaSchoolLicenseEntity,
	MediaSchoolLicenseEntityProps
>(MediaSchoolLicenseEntity, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		school: schoolEntityFactory.build(),
		type: SchoolLicenseType.MEDIA_LICENSE,
		mediumId: `medium-${sequence}`,
		mediaSource: mediaSourceEntityFactory.build(),
	};
});
