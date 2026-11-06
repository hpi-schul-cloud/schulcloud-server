import { Embeddable, Embedded, Property } from '@mikro-orm/decorators/legacy';
import { CustomParameterEntryEntity } from '../../../common/entity';
import { ArrayType } from '@mikro-orm/core';

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

	@Embedded(() => CustomParameterEntryEntity, { array: true, type: ArrayType<CustomParameterEntryEntity> })
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
		this.title = props.title;
		this.url = props.url;
		this.parameters = props.parameters;
		this.text = props.text;
		this.availableFrom = props.availableFrom;
		this.availableUntil = props.availableUntil;
		this.submissionFrom = props.submissionFrom;
		this.submissionUntil = props.submissionUntil;
	}
}
