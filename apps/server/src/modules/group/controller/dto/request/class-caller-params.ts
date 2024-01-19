import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ClassRequestContext } from '../interface';

export class ClassCallerParams {
	@IsOptional()
	@IsEnum(ClassRequestContext)
	@ApiPropertyOptional({ enum: ClassRequestContext, enumName: 'ClassRequestContext' })
	calledFrom?: ClassRequestContext;
}
