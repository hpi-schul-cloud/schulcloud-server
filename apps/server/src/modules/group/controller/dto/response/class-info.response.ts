import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EntityId } from '@shared/domain/types';
import { ClassRootType } from '../../../uc/dto/class-root-type';

export class ClassInfoResponse {
	@ApiProperty()
	id: EntityId;

	@ApiProperty({ enum: ClassRootType })
	type: ClassRootType;

	@ApiProperty()
	name: string;

	@ApiPropertyOptional()
	externalSourceName?: string;

	@ApiProperty({ type: [String] })
	teacherNames: string[];

	@ApiPropertyOptional()
	schoolYear?: string;

	@ApiPropertyOptional()
	isUpgradable?: boolean;

	@ApiProperty()
	studentCount: number;

	@ApiPropertyOptional()
	synchronizedCourses?: EntityId[];

	constructor(props: ClassInfoResponse) {
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
