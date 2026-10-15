import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { MediaSourceEntity } from '@modules/media-source/entity';
import { GroupLicenseType } from '../enum';
import { GroupLicenseEntity, GroupLicenseEntityProps } from './group-license.entity';

export interface MediaGroupLicenseEntityProps extends GroupLicenseEntityProps {
	mediumId: string;
	mediaSource?: MediaSourceEntity;
}

@Entity({ discriminatorValue: GroupLicenseType.MEDIA_LICENSE })
export class MediaGroupLicenseEntity extends GroupLicenseEntity {
	constructor(props: MediaGroupLicenseEntityProps) {
		super(props);
		this.type = GroupLicenseType.MEDIA_LICENSE;
		this.mediumId = props.mediumId;
		this.mediaSource = props.mediaSource;
	}

	@Property()
	mediumId: string;

	@ManyToOne(() => MediaSourceEntity, { nullable: true })
	mediaSource?: MediaSourceEntity;
}
