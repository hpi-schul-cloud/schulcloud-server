import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { BiloLinkResponse } from './bilo-link.response';

export class BiloMediaQueryResponse {
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
	public modified!: number;
}
