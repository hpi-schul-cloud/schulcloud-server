import { faker } from '@faker-js/faker';
import { BaseFactory } from '@testing/factory/base.factory';
import { Factory } from 'fishery';
import { ContentElementType } from '../../../infra/common-cartridge-clients/enum/content-element-type.enum';
import { LinkElementContent, LinkElementResponse, TimestampsResponse } from '@infra/common-cartridge-clients';

export const linkElementContentFactory = Factory.define<LinkElementContent>(() => {
	return {
		url: faker.internet.url(),
		title: faker.lorem.word(),
		description: faker.lorem.sentence(),
	};
});

class LinkElementResponseImpl implements LinkElementResponse {
	public readonly id: string;
	public readonly type: ContentElementType;
	public readonly content: LinkElementContent;
	public readonly timestamps: TimestampsResponse;

	constructor(props: Readonly<LinkElementResponseImpl>) {
		this.id = props.id;
		this.type = props.type;
		this.content = props.content;
		this.timestamps = props.timestamps;
	}
}
class LinkElementFactory extends BaseFactory<LinkElementResponseImpl, Readonly<LinkElementResponseImpl>> {}
export const linkElementFactory = LinkElementFactory.define(LinkElementResponseImpl, () => {
	return {
		id: faker.string.uuid(),
		type: ContentElementType.LINK,
		content: linkElementContentFactory.build(),
		timestamps: {
			lastUpdatedAt: faker.date.recent().toISOString(),
			createdAt: faker.date.recent().toISOString(),
			deletedAt: undefined,
		},
	};
});
