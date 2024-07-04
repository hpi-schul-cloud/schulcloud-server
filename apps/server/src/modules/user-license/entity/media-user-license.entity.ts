import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { MediaSourceEntity } from './media-source.entity';
import { UserLicenseType } from './user-license-type';
import { UserLicenseEntity, UserLicenseProps } from './user-license.entity';

export interface MediaUserLicenseEntityProps extends UserLicenseProps {
	mediumId: string;
	mediaSource?: MediaSourceEntity;
}

@Entity({ discriminatorValue: UserLicenseType.MEDIA_LICENSE })
export class MediaUserLicenseEntity extends UserLicenseEntity {
	constructor(props: MediaUserLicenseEntityProps) {
		super(props);
		this.type = UserLicenseType.MEDIA_LICENSE;
		this.mediumId = props.mediumId;
		this.mediaSource = props.mediaSource;
	}

	@Property()
	mediumId: string;

	@ManyToOne(() => MediaSourceEntity, { nullable: true })
	mediaSource?: MediaSourceEntity;
}
