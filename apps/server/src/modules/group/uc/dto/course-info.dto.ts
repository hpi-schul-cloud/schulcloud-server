import { EntityId } from '@shared/domain/types';

export class CourseInfoDto {
	id: EntityId;

	name: string;

	constructor(props: CourseInfoDto) {
		this.id = props.id;
		this.name = props.name;
	}
}
