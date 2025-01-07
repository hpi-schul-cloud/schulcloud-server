import { BaseFactory } from '@shared/testing';
import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';
import { RichTextElementResponseDto } from '../common-cartridge-client/card-client/dto/rich-text-element-response.dto';
import { RichTextElementContentDto } from '../common-cartridge-client/card-client/dto/rich-text-element-content.dto';
import { ContentElementType } from '../common-cartridge-client/card-client/enums/content-element-type.enum';

export const richTextElementContentFactory = Factory.define<RichTextElementContentDto>(() => {
	return {
		text: faker.lorem.word(),
		inputFormat: 'plainText',
	};
});

class RichTextElement extends BaseFactory<RichTextElementResponseDto, Readonly<RichTextElementResponseDto>> {}
export const richTextElementFactroy = RichTextElement.define(RichTextElementResponseDto, () => {
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
