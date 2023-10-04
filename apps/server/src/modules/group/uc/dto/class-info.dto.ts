export class ClassInfoDto {
	id?: string;

	name: string;

	externalSourceName?: string;

	teachers: string[];

	constructor(props: ClassInfoDto) {
		this.id = props.id;
		this.name = props.name;
		this.externalSourceName = props.externalSourceName;
		this.teachers = props.teachers;
	}
}
