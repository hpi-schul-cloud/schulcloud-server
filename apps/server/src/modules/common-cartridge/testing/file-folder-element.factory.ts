import { Factory } from 'fishery';
import { faker } from '@faker-js/faker';
import { ContentElementType } from '@modules/board';
import { BaseFactory } from '@testing/factory/base.factory';
import { FileFolderElementContentDto } from '../common-cartridge-client/card-client/dto/file-folder-element-content.dto';
import { FileFolderElementResponseDto } from '../common-cartridge-client/card-client/dto';

export const fileFolderElementContentFactory = Factory.define<FileFolderElementContentDto>(() => {
	return {
		title: faker.lorem.text(),
	};
});

class FileFolderElementResponseDtoFactory extends BaseFactory<
	FileFolderElementResponseDto,
	Readonly<FileFolderElementResponseDto>
> {}

export const fileFolderElementResponseDtoFactory = FileFolderElementResponseDtoFactory.define(
	FileFolderElementResponseDto,
	() => {
		return {
			id: faker.string.uuid(),
			type: ContentElementType.FILE_FOLDER,
			content: fileFolderElementContentFactory.build(),
			timestamps: {
				lastUpdatedAt: faker.date.recent().toISOString(),
				createdAt: faker.date.recent().toISOString(),
				deletedAt: undefined,
			},
		};
	}
);
