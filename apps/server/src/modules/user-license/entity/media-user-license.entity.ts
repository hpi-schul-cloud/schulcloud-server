import { Entity, Property } from '@mikro-orm/core';
import { UserLicenseType } from './user-license-type';
import { UserLicenseEntity, UserLicenseProps } from './user-license.entity';

export interface MediaUserLicenseEntityProps extends UserLicenseProps {
	mediumId: string;
	mediaSourceId?: string;
}

@Entity({ discriminatorValue: UserLicenseType.MEDIA_LICENSE })
export class MediaUserLicenseEntity extends UserLicenseEntity {
	constructor(props: MediaUserLicenseEntityProps) {
		super(props);
		this.type = UserLicenseType.MEDIA_LICENSE;
		this.mediumId = props.mediumId;
		this.mediaSourceId = props.mediaSourceId;
	}

	@Property()
	mediumId: string;

	@Property({ nullable: true })
	mediaSourceId?: string;
}
