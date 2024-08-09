import { EntityId } from '@shared/domain/types';
import { ClassInfoDto } from './class-info.dto';

export class CourseInfoDto {
	id: EntityId;

	name: string;

	teacherNames: string[];

	classes: string[];

	schoolYear?: string;

	studentCount: number;

	syncedGroup?: ClassInfoDto;

	constructor(props: CourseInfoDto) {
		this.id = props.id;
		this.name = props.name;
		this.classes = props.classes;
		this.teacherNames = props.teacherNames;
		this.schoolYear = props.schoolYear;
		this.studentCount = props.studentCount;
		this.syncedGroup = props.syncedGroup;
	}
}
