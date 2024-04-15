import { IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class EtherpadBaseResponse {
	@IsObject()
	@IsNumber()
	code!: number;

	@IsOptional()
	@IsString()
	message?: string;
}
