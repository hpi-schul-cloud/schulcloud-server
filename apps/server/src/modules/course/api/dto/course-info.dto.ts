import { EntityId } from '@shared/domain/types';

export class CourseInfoDto {
	id: EntityId;

	name: string;

	teachers: string[];

	classes: string[];

	syncedGroupName?: string;

	constructor(props: CourseInfoDto) {
		this.id = props.id;
		this.name = props.name;
		this.classes = props.classes;
		this.teachers = props.teachers;
		this.syncedGroupName = props.syncedGroupName;
	}
}
