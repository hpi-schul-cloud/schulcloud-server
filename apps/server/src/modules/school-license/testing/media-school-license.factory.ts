import { ObjectId } from '@mikro-orm/mongodb';
import { mediaSourceFactory } from '@modules/media-source/testing';
import { BaseFactory } from '@testing/factory/base.factory';
import { MediaSchoolLicense, MediaSchoolLicenseProps } from '../domain';
import { SchoolLicenseType } from '../enum';

export const mediaSchoolLicenseFactory = BaseFactory.define<MediaSchoolLicense, MediaSchoolLicenseProps>(
	MediaSchoolLicense,
	({ sequence }) => {
		return {
			id: new ObjectId().toHexString(),
			schoolId: new ObjectId().toHexString(),
			type: SchoolLicenseType.MEDIA_LICENSE,
			mediumId: `medium-${sequence}`,
			mediaSource: mediaSourceFactory.build(),
		};
	}
);
