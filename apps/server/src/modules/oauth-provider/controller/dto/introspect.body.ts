import { IsString } from 'class-validator';

export class IntrospectBody {
	@IsString()
	token!: string;
}
