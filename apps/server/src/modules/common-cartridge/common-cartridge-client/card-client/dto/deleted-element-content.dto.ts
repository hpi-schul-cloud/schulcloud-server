import { ContentElementType } from '../enums/content-element-type.enum';

export class DeletedElementContentDto {
	title: string;

	deletedElementType: ContentElementType;

	description: string;

	constructor(title: string, deletedElementType: ContentElementType, description: string) {
		this.title = title;
		this.deletedElementType = deletedElementType;
		this.description = description;
	}
}
