import { IsString } from 'class-validator';

export class RedirectBody {
	@IsString()
	redirect_to!: string;
}
