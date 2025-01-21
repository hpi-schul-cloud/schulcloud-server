import { Factory } from 'fishery';
import { faker } from '@faker-js/faker';
import { ContentElementType } from '@modules/board';
import { BaseFactory } from '@testing/factory/base.factory';
import { FileElementContentDto } from '../common-cartridge-client/card-client/dto/file-element-content.dto';
import { FileElementResponseDto } from '../common-cartridge-client/card-client/dto';

export const fileElementContentFactory = Factory.define<FileElementContentDto>(() => {
	return {
		caption: faker.lorem.sentence(),
		alternativeText: faker.lorem.sentence(),
	};
});

class FileElementResponseDtoFactory extends BaseFactory<FileElementResponseDto, Readonly<FileElementResponseDto>> {}

export const fileElementResponseDtoFactory = FileElementResponseDtoFactory.define(FileElementResponseDto, () => {
	return {
		id: faker.string.uuid(),
		type: ContentElementType.FILE,
		content: fileElementContentFactory.build(),
		timestamps: {
			lastUpdatedAt: faker.date.recent().toISOString(),
			createdAt: faker.date.recent().toISOString(),
			deletedAt: undefined,
		},
	};
});
