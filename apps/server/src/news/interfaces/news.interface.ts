import { Document, LeanDocument, ObjectId } from 'mongoose';

/** describes the news schema */
export class NewsDocument extends Document {
	schoolId: ObjectId;

	title: string;
	content: string;
	displayAt: Date;

	creatorId?: ObjectId;
	updaterId?: ObjectId;

	createdAt: Date;
	updatedAt?: Date;

	externalId?: string;
	source: 'internal' | 'rss';
	sourceDescription?: string;

	// target and targetModel must exist or not exist
	target?: ObjectId;
	targetModel?: string;
}

export type News = LeanDocument<NewsDocument>;
