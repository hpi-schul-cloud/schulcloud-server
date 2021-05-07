import { Exclude, Expose, Type } from 'class-transformer';
import { Types, Document } from 'mongoose';
import { ExposeMongoIdAsString, WithTimeStampBaseEntity } from '../../../shared/core/repo/entity/base.entity';
import { School } from '../../../shared/domain/entities/school/school.model';
import { User } from '../../../shared/domain/entities/user/user.model';

export class News extends WithTimeStampBaseEntity {
	/** the news title */
	@Expose()
	title: string;
	/** the news content as html */
	@Expose()
	content: string;
	/** only past news are visible for viewers, when edit permission, news visible in the future might be accessed too  */
	@Expose()
	displayAt: Date;

	@Expose()
	source: 'internal' | 'rss';

	// hidden api properties

	@Exclude()
	externalId?: string;
	@Exclude()
	sourceDescription?: string;

	// target and targetModel both must either exist or not
	@ExposeMongoIdAsString()
	/** id reference to a collection */
	target?: Types.ObjectId;
	/** name of a collection which is referenced in target */
	@Expose()
	targetModel?: string;

	// populated properties

	@ExposeMongoIdAsString()
	schoolId: Types.ObjectId;

	/** user id of creator */
	@ExposeMongoIdAsString()
	creatorId: Types.ObjectId;

	/** when updated, the user id of the updating user */
	@ExposeMongoIdAsString()
	updaterId?: Types.ObjectId;

	@Type(() => School)
	@Expose()
	school?: School;

	@Type(() => User)
	@Expose()
	creator?: User;

	@Type(() => User)
	@Expose()
	updater?: User;

	// decorated properties
	@Expose()
	permissions: string[] = [];

	constructor(partial: Partial<News>) {
		super();
		Object.assign(this, partial);
	}
}

export type INews = Document & News;
