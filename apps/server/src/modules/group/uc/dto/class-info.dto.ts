import { EntityId } from '@shared/domain/types';
import { ClassRootType } from './class-root-type';

export class ClassInfoDto {
	id: EntityId;

	type: ClassRootType;

	name: string;

	externalSourceName?: string;

	teacherNames: string[];

	schoolYear?: string;

	isUpgradable?: boolean;

	studentCount: number;

	synchronizedCourses?: EntityId[];

	constructor(props: ClassInfoDto) {
		this.id = props.id;
		this.type = props.type;
		this.name = props.name;
		this.externalSourceName = props.externalSourceName;
		this.teacherNames = props.teacherNames;
		this.schoolYear = props.schoolYear;
		this.isUpgradable = props.isUpgradable;
		this.studentCount = props.studentCount;
		this.synchronizedCourses = props.synchronizedCourses;
	}
}
