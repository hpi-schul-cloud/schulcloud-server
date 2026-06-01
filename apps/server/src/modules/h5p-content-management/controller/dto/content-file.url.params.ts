import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class ContentFileUrlParams {
	@ApiProperty()
	@IsMongoId()
	id!: string;

	@ApiProperty()
	// In NestJS v11 (path-to-regexp v8), wildcard params are captured as arrays.
	// Transform joins the array segments back to a slash-separated string.
	@Transform(({ value }: { value: string | string[] }): string => (Array.isArray(value) ? value.join('/') : value))
	@IsString()
	@IsNotEmpty()
	filename!: string;
}
