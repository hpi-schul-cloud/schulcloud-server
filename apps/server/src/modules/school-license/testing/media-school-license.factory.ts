import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { mediaSourceFactory } from '@modules/media-source/testing';
import { schoolFactory } from '@modules/school/testing';
import { MediaSchoolLicense, MediaSchoolLicenseProps } from '../domain';
import { SchoolLicenseType } from '../enum';

export const mediaSchoolLicenseFactory = BaseFactory.define<MediaSchoolLicense, MediaSchoolLicenseProps>(
	MediaSchoolLicense,
	({ sequence }) => {
		return {
			id: new ObjectId().toHexString(),
			school: schoolFactory.build(),
			type: SchoolLicenseType.MEDIA_LICENSE,
			mediumId: `medium-${sequence}`,
			mediaSource: mediaSourceFactory.build(),
		};
	}
);
