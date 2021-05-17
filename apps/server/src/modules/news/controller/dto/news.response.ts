import { Expose } from 'class-transformer';
import { SchoolInfoResponse } from './school-info.response';
import { UserInfoResponse } from './user-info.response';

export class NewsResponse {
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
	school: SchoolInfoResponse;

	@Expose()
	creator: UserInfoResponse;

	@Expose()
	updater: UserInfoResponse;

	@Expose()
	createdAt: Date;

	@Expose()
	updatedAt: Date;

	@Expose()
	permissions: string[];
}
