import { Expose } from 'class-transformer';

export class SchoolInfoResponse {
	@Expose()
	id: string;

	@Expose()
	name: string;
}
