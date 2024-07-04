export class SchoolExternalToolRef {
	schoolToolId: string;

	schoolId?: string;

	constructor(props: SchoolExternalToolRef) {
		this.schoolToolId = props.schoolToolId;
		this.schoolId = props.schoolId;
	}
}
