import { Expose } from 'class-transformer';

export class UserInfoResponseDto {
	@Expose()
	id: string;

	@Expose()
	firstName: string;

	@Expose()
	lastName: string;
}
