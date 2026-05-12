import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class LibraryFileUrlParams {
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	ubername!: string;

	@ApiProperty()
	// In NestJS v11 (path-to-regexp v8), wildcard params are captured as arrays.
	// Transform joins the array segments back to a slash-separated string.
	@Transform(({ value }: { value: string | string[] }): string => (Array.isArray(value) ? value.join('/') : value))
	@IsString()
	@IsNotEmpty()
	file!: string;
}
