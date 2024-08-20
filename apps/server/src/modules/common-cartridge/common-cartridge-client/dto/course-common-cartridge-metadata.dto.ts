export class CourseCommonCartridgeMetadataDto {
	id?: string;

	title?: string;

	creationDate?: string;

	copyRightOwners?: Array<string>;

	constructor(props: CourseCommonCartridgeMetadataDto) {
		Object.assign(this, props);
	}
}
