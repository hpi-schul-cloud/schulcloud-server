import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EntityId } from '@shared/domain/types';

export class CourseInfoDataResponse {
	@ApiProperty()
	id: EntityId;

	@ApiProperty()
	name: string;

	@ApiProperty({ type: [String] })
	teacherNames: string[];

	@ApiProperty()
	classNames: string[];

	@ApiPropertyOptional()
	syncedGroup?: string;

	constructor(props: CourseInfoDataResponse) {
		this.id = props.id;
		this.name = props.name;
		this.classNames = props.classNames;
		this.teacherNames = props.teacherNames;
		this.syncedGroup = props.syncedGroup;
	}
}
