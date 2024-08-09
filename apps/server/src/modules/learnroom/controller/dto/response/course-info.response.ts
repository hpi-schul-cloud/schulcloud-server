import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EntityId } from '@shared/domain/types';
import { ClassInfoResponse } from './class-info.reponse';

export class CourseInfoResponse {
	@ApiProperty()
	id: EntityId;

	@ApiProperty()
	name: string;

	@ApiProperty({ type: [String] })
	teacherNames: string[];

	@ApiProperty()
	classes: string[];

	@ApiPropertyOptional()
	schoolYear?: string;

	@ApiProperty()
	studentCount: number;

	@ApiPropertyOptional()
	syncedGroup?: ClassInfoResponse;

	constructor(props: CourseInfoResponse) {
		this.id = props.id;
		this.name = props.name;
		this.classes = props.classes;
		this.teacherNames = props.teacherNames;
		this.schoolYear = props.schoolYear;
		this.studentCount = props.studentCount;
		this.syncedGroup = props.syncedGroup;
	}
}
