import { IsOptional, IsString } from 'class-validator';

export class SchoolQueryParams {
	@IsOptional()
	@IsString()
	schoolnumber?: string;
}
