import { Course } from '@modules/course';
import { EntityId } from '@shared/domain/types';
import { ClassRootType } from './class-root-type';

export class ClassInfoDto {
	public id: EntityId;

	public type: ClassRootType;

	public name: string;

	public externalSourceName?: string;

	public teacherNames: string[];

	public schoolYear?: string;

	public isUpgradable?: boolean;

	public studentCount: number;

	public synchronizedCourses?: Course[];

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
