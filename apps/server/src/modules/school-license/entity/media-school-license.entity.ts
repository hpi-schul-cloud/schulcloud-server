import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { MediaSourceEntity } from '@src/modules/mediasource/entity';
import { SchoolLicenseType } from '../enum';
import { SchoolLicenseEntity, SchoolLicenseProps } from './school-license.entity';

export interface MediaSchoolLicenseEntityProps extends SchoolLicenseProps {
	mediumId: string;
	mediaSource?: MediaSourceEntity;
}

@Entity()
export class MediaSchoolLicenseEntity extends SchoolLicenseEntity {
	constructor(props: MediaSchoolLicenseEntityProps) {
		super(props);
		this.type = SchoolLicenseType.MEDIA_LICENSE;
		this.mediumId = props.mediumId;
		this.mediaSource = props.mediaSource;
	}

	@Property()
	mediumId: string;

	@ManyToOne(() => MediaSourceEntity, { nullable: true })
	mediaSource?: MediaSourceEntity;
}
