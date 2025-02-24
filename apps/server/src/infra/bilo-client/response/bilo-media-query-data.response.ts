import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { BiloLinkResponse } from './bilo-link.response';

export class BiloMediaQueryDataResponse {
	@IsString()
	public id!: string;

	@IsString()
	public title!: string;

	@IsString()
	@IsOptional()
	public author?: string;

	@IsString()
	@IsOptional()
	public description?: string;

	@IsString()
	public publisher!: string;

	@ValidateNested({ each: true })
	@Type(() => BiloLinkResponse)
	public cover!: BiloLinkResponse;

	@ValidateNested({ each: true })
	@Type(() => BiloLinkResponse)
	public coverSmall!: BiloLinkResponse;

	@IsInt()
	@Min(0)
	public modified!: number;
}
