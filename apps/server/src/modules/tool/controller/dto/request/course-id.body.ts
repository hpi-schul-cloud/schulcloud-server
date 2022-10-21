import { IsMongoId, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CourseIdBody {
	@IsOptional()
	@IsMongoId()
	@ApiPropertyOptional()
	courseId?: string;
}
