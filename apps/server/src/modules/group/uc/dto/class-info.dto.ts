export class ClassInfoDto {
	name: string;

	externalSourceName?: string;

	teachers: string[];

	constructor(props: ClassInfoDto) {
		this.name = props.name;
		this.externalSourceName = props.externalSourceName;
		this.teachers = props.teachers;
	}
}
