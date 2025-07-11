import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { CourseStatus } from '../../domain';
import { StringToBoolean } from '@shared/controller/transformer';

export class CourseFilterParams {
	@IsOptional()
	@IsEnum(CourseStatus)
	@ApiPropertyOptional({ enum: CourseStatus, enumName: 'CourseStatus' })
	public status?: CourseStatus;

	@IsBoolean()
	@StringToBoolean()
	@ApiPropertyOptional()
	public withoutTeacher?: boolean = false;
}
