import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { BiloLinkResponse } from './bilo-link.response';

export class BiloMediaQueryDataResponse {
	@IsString()
	id!: string;

	@IsString()
	title!: string;

	@IsString()
	@IsOptional()
	author?: string;

	@IsString()
	@IsOptional()
	description?: string;

	@IsString()
	publisher!: string;

	@ValidateNested({ each: true })
	@Type(() => BiloLinkResponse)
	cover!: BiloLinkResponse;

	@ValidateNested({ each: true })
	@Type(() => BiloLinkResponse)
	coverSmall!: BiloLinkResponse;

	@IsInt()
	@Min(0)
	modified!: number;
}
