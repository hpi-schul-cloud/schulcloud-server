import { Factory } from 'fishery';
import { faker } from '@faker-js/faker';
import { ContentElementType } from '@modules/board';
import { BaseFactory } from '@testing/factory/base.factory';
import {
	FileFolderElementContent,
	FileFolderElementResponse,
	TimestampsResponse,
} from '@infra/common-cartridge-clients';

export const fileFolderElementContentFactory = Factory.define<FileFolderElementContent>(() => {
	return {
		title: faker.lorem.text(),
	};
});

class FileFolderElementResponseImpl implements FileFolderElementResponse {
	public readonly id: string;
	public readonly type: ContentElementType;
	public readonly content: FileFolderElementContent;
	public readonly timestamps: TimestampsResponse;

	constructor(props: Readonly<FileFolderElementResponseImpl>) {
		this.id = props.id;
		this.type = props.type;
		this.content = props.content;
		this.timestamps = props.timestamps;
	}
}
class FileFolderElementResponseDtoFactory extends BaseFactory<
	FileFolderElementResponseImpl,
	Readonly<FileFolderElementResponseImpl>
> {}
export const fileFolderElementResponseDtoFactory = FileFolderElementResponseDtoFactory.define(
	FileFolderElementResponseImpl,
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
