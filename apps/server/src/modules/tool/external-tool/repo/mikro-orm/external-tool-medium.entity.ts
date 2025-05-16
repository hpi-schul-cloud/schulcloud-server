import { Embeddable, Property } from '@mikro-orm/core';
import { ExternalToolMediumStatus } from '../../enum';

@Embeddable()
export class ExternalToolMediumEntity {
	@Property({ nullable: false })
	status: ExternalToolMediumStatus;

	@Property({ nullable: true })
	mediumId?: string;

	@Property({ nullable: true })
	publisher?: string;

	@Property({ nullable: true })
	mediaSourceId?: string;

	@Property({ nullable: true })
	metadataModifiedAt?: Date;

	constructor(props: ExternalToolMediumEntity) {
		this.status = props.status;
		this.mediumId = props.mediumId;
		this.publisher = props.publisher;
		this.mediaSourceId = props.mediaSourceId;
		this.metadataModifiedAt = props.metadataModifiedAt;
	}
}
