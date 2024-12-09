import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class VidisItemResponse {
	@IsString()
	@IsOptional()
	educationProviderOrganizationName?: string;

	@IsString()
	@IsOptional()
	offerDescription?: string;

	@IsString()
	offerId!: string;

	@IsString()
	@IsOptional()
	offerLink?: string;

	@IsString()
	@IsOptional()
	offerLogo?: string;

	@IsString()
	@IsOptional()
	offerLongTitle?: string;

	@IsString()
	@IsOptional()
	offerTitle?: string;

	@IsNumber()
	@IsOptional()
	offerVersion?: number;

	@IsArray()
	schoolActivations!: string[];
}
