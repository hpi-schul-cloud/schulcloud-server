export class CourseCommonCartridgeMetadataDto {
	id?: string;

	title?: string;

	creationDate?: string;

	copyRightOwners?: Array<string>;

	constructor(props: CourseCommonCartridgeMetadataDto) {
		this.id = props.id;
		this.title = props.title;
		this.creationDate = props.creationDate;
		this.copyRightOwners = props.copyRightOwners;
	}
}
