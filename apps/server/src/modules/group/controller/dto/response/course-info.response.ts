import { ApiProperty } from '@nestjs/swagger';
import { EntityId } from '@shared/domain/types';

export class CourseInfoResponse {
	@ApiProperty()
	id: EntityId;

	@ApiProperty()
	name: string;

	constructor(props: CourseInfoResponse) {
		this.id = props.id;
		this.name = props.name;
	}
}
