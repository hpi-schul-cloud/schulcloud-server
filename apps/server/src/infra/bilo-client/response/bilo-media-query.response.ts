import { Type } from 'class-transformer';
import { IsEnum, ValidateNested } from 'class-validator';
import { BiloMediaQueryBodyParams } from '../request';
import { BiloMediaQueryDataResponse } from './bilo-media-query-data.response';

export class BiloMediaQueryResponse {
	@ValidateNested({ each: true })
	@Type(() => BiloMediaQueryBodyParams)
	public query!: BiloMediaQueryBodyParams;

	@IsEnum([200, 400, 404])
	public status!: number;

	@ValidateNested({ each: true })
	@Type(() => BiloMediaQueryDataResponse)
	public data!: BiloMediaQueryDataResponse;
}
