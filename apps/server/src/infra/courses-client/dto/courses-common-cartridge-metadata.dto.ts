export class CourseCommonCartridgeMetadataDto {
	public id: string;

	public courseName: string;

	public creationDate?: string;

	public copyRightOwners: Array<string>;

	constructor(props: CourseCommonCartridgeMetadataDto) {
		this.id = props.id;
		this.courseName = props.courseName;
		this.creationDate = props.creationDate;
		this.copyRightOwners = props.copyRightOwners;
	}
}
