import { faker } from '@faker-js/faker';
import { BaseFactory } from '@testing/factory/base.factory';
import { Factory } from 'fishery';
import { LinkElementContentDto } from '../common-cartridge-client/card-client/dto/link-element-content.dto';
import { LinkElementResponseDto } from '../common-cartridge-client/card-client/dto/link-element-response.dto';
import { ContentElementType } from '../common-cartridge-client/card-client/enums/content-element-type.enum';

export const linkElementContentFactory = Factory.define<LinkElementContentDto>(() => {
	return {
		url: faker.internet.url(),
		title: faker.lorem.word(),
		description: faker.lorem.sentence(),
	};
});

class LinkElementFactory extends BaseFactory<LinkElementResponseDto, Readonly<LinkElementResponseDto>> {}
export const linkElementFactory = LinkElementFactory.define(LinkElementResponseDto, () => {
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
