import { EntityId } from '@shared/domain/types';

export class CourseInfoDto {
	id: EntityId;

	name: string;

	teachers: string[];

	classes: string[];

	courseStatus?: string;

	syncedWithGroup?: string;

	constructor(props: CourseInfoDto) {
		this.id = props.id;
		this.name = props.name;
		this.classes = props.classes;
		this.teachers = props.teachers;
		this.courseStatus = props.courseStatus;
		this.syncedWithGroup = props.syncedWithGroup;
	}
}
