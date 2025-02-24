import { Embeddable, Property } from '@mikro-orm/core';

@Embeddable()
export class ExternalToolMediumEntity {
	@Property({ nullable: false })
	mediumId: string;

	@Property({ nullable: true })
	publisher?: string;

	@Property({ nullable: true })
	mediaSourceId?: string;

	@Property({ nullable: true })
	metadataModifiedAt?: Date;

	constructor(props: ExternalToolMediumEntity) {
		this.mediumId = props.mediumId;
		this.publisher = props.publisher;
		this.mediaSourceId = props.mediaSourceId;
		this.metadataModifiedAt = props.metadataModifiedAt;
	}
}
