export class SchoolExternalToolRefDO {
	schoolToolId: string;

	schoolId?: string;

	constructor(props: SchoolExternalToolRefDO) {
		this.schoolToolId = props.schoolToolId;
		this.schoolId = props.schoolId;
	}
}
