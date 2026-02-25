import { Factory } from 'fishery';
import { faker } from '@faker-js/faker';
import { ContentElementType } from '@modules/board';
import { BaseFactory } from '@testing/factory/base.factory';
import { FileFolderElementContentDto } from '../../../infra/common-cartridge-clients/dto/card/file-folder-element-content.dto';
import { FileFolderElementResponseDto } from '../../../infra/common-cartridge-clients/dto/card';

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
