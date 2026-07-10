import { IsString } from 'class-validator';

export class BiloMediaQueryBodyParams {
	@IsString()
	id!: string;
}
