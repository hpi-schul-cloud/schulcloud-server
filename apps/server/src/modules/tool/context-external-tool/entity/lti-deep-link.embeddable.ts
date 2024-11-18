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

	@Embedded(() => CustomParameterEntryEntity, { array: true })
	parameters: CustomParameterEntryEntity[];

	constructor(props: LtiDeepLinkEmbeddable) {
		this.mediaType = props.mediaType;
		this.title = props.title;
		this.url = props.url;
		this.parameters = props.parameters;
	}
}
