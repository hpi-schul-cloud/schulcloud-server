import { ClassRootType } from './class-root-type';

export class ClassInfoDto {
	id: string;

	type: ClassRootType;

	name: string;

	externalSourceName?: string;

	teachers: string[];

	schoolYear?: string;

	isUpgradable?: boolean;

	studentCount: number;

	constructor(props: ClassInfoDto) {
		this.id = props.id;
		this.type = props.type;
		this.name = props.name;
		this.externalSourceName = props.externalSourceName;
		this.teachers = props.teachers;
		this.schoolYear = props.schoolYear;
		this.isUpgradable = props.isUpgradable;
		this.studentCount = props.studentCount;
	}
}
