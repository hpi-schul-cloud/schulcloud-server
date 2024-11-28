export class CourseCommonCartridgeMetadataDto {
	id: string;

	courseName: string;

	creationDate?: string;

	copyRightOwners: Array<string>;

	constructor(props: CourseCommonCartridgeMetadataDto) {
		this.id = props.id;
		this.courseName = props.courseName;
		this.creationDate = props.creationDate;
		this.copyRightOwners = props.copyRightOwners;
	}
}
