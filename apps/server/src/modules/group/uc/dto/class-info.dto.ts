export class ClassInfoDto {
	name: string;

	externalSourceName?: string;

	teachers: string[];

	isUpgradable?: boolean;

	constructor(props: ClassInfoDto) {
		this.name = props.name;
		this.externalSourceName = props.externalSourceName;
		this.teachers = props.teachers;
	}
}
