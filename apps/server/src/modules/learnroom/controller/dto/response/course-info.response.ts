import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EntityId } from '@shared/domain/types';

export class CourseInfoResponse {
	@ApiProperty()
	id: EntityId;

	@ApiProperty()
	name: string;

	@ApiProperty({ type: [String] })
	teacherNames: string[];

	@ApiProperty()
	classNames: string[];

	@ApiPropertyOptional()
	courseStatus?: string;

	@ApiPropertyOptional()
	syncedGroup?: string;

	constructor(props: CourseInfoResponse) {
		this.id = props.id;
		this.name = props.name;
		this.classNames = props.classNames;
		this.teacherNames = props.teacherNames;
		this.courseStatus = props.courseStatus;
		this.syncedGroup = props.syncedGroup;
	}
}
