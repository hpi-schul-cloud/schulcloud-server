import { faker } from '@faker-js/faker';
import {
	ContentElementType,
	RichTextElementContent,
	RichTextElementResponse,
	TimestampsResponse,
} from '@infra/common-cartridge-clients';
import { BaseFactory } from '@testing/factory/base.factory';
import { Factory } from 'fishery';

export const richTextElementContentFactory = Factory.define<RichTextElementContent>(() => {
	return {
		text: faker.lorem.word(),
		inputFormat: 'plainText',
	};
});

class RichTextElementResponseImpl implements RichTextElementResponse {
	public readonly id: string;
	public readonly type: ContentElementType;
	public readonly content: RichTextElementContent;
	public readonly timestamps: TimestampsResponse;

	constructor(props: Readonly<RichTextElementResponseImpl>) {
		this.id = props.id;
		this.type = props.type;
		this.content = props.content;
		this.timestamps = props.timestamps;
	}
}
class RichTextElementFactory extends BaseFactory<RichTextElementResponseImpl, Readonly<RichTextElementResponseImpl>> {}
export const richTextElementFactroy = RichTextElementFactory.define(RichTextElementResponseImpl, () => {
	return {
		id: faker.string.uuid(),
		type: ContentElementType.RICH_TEXT,
		content: richTextElementContentFactory.build(),
		timestamps: {
			lastUpdatedAt: faker.date.recent().toISOString(),
			createdAt: faker.date.recent().toISOString(),
			deletedAt: undefined,
		},
	};
});
