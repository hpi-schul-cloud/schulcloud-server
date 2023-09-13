export class ClassInfoResponse {
	name: string;

	externalSourceName?: string;

	teachers: string[];

	constructor(props: ClassInfoResponse) {
		this.name = props.name;
		this.externalSourceName = props.externalSourceName;
		this.teachers = props.teachers;
	}
}
