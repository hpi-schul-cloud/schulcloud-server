import { Expose } from 'class-transformer';

export class SchoolInfoResponseDto {
	@Expose()
	id: string;

	@Expose()
	name: string;
}
