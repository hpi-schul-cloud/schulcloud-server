import { Factory } from 'fishery';
import { faker } from '@faker-js/faker';
import { ContentElementType } from '@modules/board';
import { BaseFactory } from '@testing/factory/base.factory';
import { FileElementContent, FileElementResponse, TimestampsResponse } from '@infra/common-cartridge-clients';

export const fileElementContentFactory = Factory.define<FileElementContent>(() => {
	return {
		caption: faker.lorem.sentence(),
		alternativeText: faker.lorem.sentence(),
	};
});

class FileElementResponseImpl implements FileElementResponse {
	public readonly id: string;
	public readonly type: ContentElementType;
	public readonly content: FileElementContent;
	public readonly timestamps: TimestampsResponse;

	constructor(props: Readonly<FileElementResponseImpl>) {
		this.id = props.id;
		this.type = props.type;
		this.content = props.content;
		this.timestamps = props.timestamps;
	}
}
class FileElementResponseFactory extends BaseFactory<FileElementResponseImpl, Readonly<FileElementResponseImpl>> {}
export const fileElementResponseFactory = FileElementResponseFactory.define(FileElementResponseImpl, () => {
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
