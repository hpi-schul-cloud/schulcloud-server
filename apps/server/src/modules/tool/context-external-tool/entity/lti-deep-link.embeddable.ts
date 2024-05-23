import { Embeddable, Embedded, Property } from '@mikro-orm/core';
import { CustomParameterEntryEntity } from '../../common/entity';

@Embeddable()
export class LtiDeepLinkEmbeddable {
	@Property()
	mediaType: string;

	@Property({ nullable: true })
	url?: string;

	@Property({ nullable: true })
	title?: string;

	@Property({ nullable: true })
	text?: string;

	@Embedded(() => CustomParameterEntryEntity, { array: true })
	parameters: CustomParameterEntryEntity[];

	@Property({ nullable: true })
	availableFrom?: Date;

	@Property({ nullable: true })
	availableUntil?: Date;

	@Property({ nullable: true })
	submissionFrom?: Date;

	@Property({ nullable: true })
	submissionUntil?: Date;

	constructor(props: LtiDeepLinkEmbeddable) {
		this.mediaType = props.mediaType;
		this.url = props.url;
		this.title = props.title;
		this.text = props.text;
		this.parameters = props.parameters;
		this.availableFrom = props.availableFrom;
		this.availableUntil = props.availableUntil;
		this.submissionFrom = props.submissionFrom;
		this.submissionUntil = props.submissionUntil;
	}
}
