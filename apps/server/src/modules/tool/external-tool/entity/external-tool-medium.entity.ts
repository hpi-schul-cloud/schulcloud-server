import { Embeddable, Property } from '@mikro-orm/core';

@Embeddable()
export class ExternalToolMediumEntity {
	@Property({ nullable: false })
	mediumId: string;

	@Property({ nullable: true })
	publisher?: string;

	constructor(props: ExternalToolMediumEntity) {
		this.mediumId = props.mediumId;
		this.publisher = props.publisher;
	}
}
