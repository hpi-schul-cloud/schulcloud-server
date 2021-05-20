import { Expose } from 'class-transformer';
import { SchoolInfoResponseDto } from './school-info-response.dto';
import { UserInfoResponseDto } from './user-info-response.dto';

export class NewsResponseDto {
	@Expose()
	id: string;

	@Expose()
	title: string;

	@Expose()
	content: string;

	@Expose()
	displayAt: Date;

	@Expose()
	source: 'internal' | 'rss';

	@Expose()
	target: { id: string };

	@Expose()
	targetModel: string;

	@Expose()
	school: SchoolInfoResponseDto;

	@Expose()
	creator: UserInfoResponseDto;

	@Expose()
	updater: UserInfoResponseDto;

	@Expose()
	createdAt: Date;

	@Expose()
	updatedAt: Date;

	@Expose()
	permissions: string[];
}
