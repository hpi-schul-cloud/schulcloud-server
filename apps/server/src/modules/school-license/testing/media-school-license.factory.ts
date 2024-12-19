import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { mediaSourceFactory } from '@src/modules/media-source/testing/media-source.factory';
import { MediaSchoolLicense } from '../domain';
import { MediaSchoolLicenseProps } from '../domain/media-school-license';
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
