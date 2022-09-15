import { IsBoolean, IsInt } from 'class-validator';

export class LoginRequestBody {
	@IsBoolean()
	remember?: boolean;

	@IsInt()
	remember_for?: number;
}
