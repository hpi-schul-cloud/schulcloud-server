import { Expose } from 'class-transformer';

export class UserInfoResponse {
	@Expose()
	id: string;

	@Expose()
	firstName: string;

	@Expose()
	lastName: string;
}
