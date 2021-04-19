import { Exclude, Transform } from 'class-transformer';
import { ObjectId } from 'mongoose';

class DocumentEntity {
	@Transform((value) => String(value), { toPlainOnly: true })
	_id: ObjectId;
	constructor(partial: Partial<DocumentEntity>) {
		Object.assign(this, partial);
	}
}

export class NewsEntity extends DocumentEntity {
	@Transform((value) => String(value), { toPlainOnly: true })
	schoolId: ObjectId;

	title: string;
	content: string;
	displayAt: Date;

	creatorId?: ObjectId;
	updaterId?: ObjectId;

	createdAt: Date;
	updatedAt?: Date;

	@Exclude()
	externalId?: string;
	@Exclude()
	source: 'internal' | 'rss';
	@Exclude()
	sourceDescription?: string;

	// target and targetModel must exist or not exist
	target?: ObjectId;
	targetModel?: string;

	constructor(partial: Partial<NewsEntity>) {
		super(partial);
		Object.assign(this, partial);
	}
}
