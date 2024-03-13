import { IsOptional, IsString } from 'class-validator';

export class SanisErreichbarkeitenResponse {
	@IsOptional()
	@IsString()
	typ?: string;

	@IsOptional()
	@IsString()
	kennung?: string;
}
