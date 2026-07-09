export class SchoolExternalToolRef {
	public schoolToolId: string;

	public schoolId?: string;

	constructor(props: SchoolExternalToolRef) {
		this.schoolToolId = props.schoolToolId;
		this.schoolId = props.schoolId;
	}
}
