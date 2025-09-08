export class CourseCommonCartridgeMetadataDto {
	public id: string;

	public title: string;

	public creationDate: string;

	public copyRightOwners: Array<string>;

	constructor(props: CourseCommonCartridgeMetadataDto) {
		this.id = props.id;
		this.title = props.title;
		this.creationDate = props.creationDate;
		this.copyRightOwners = props.copyRightOwners;
	}
}
