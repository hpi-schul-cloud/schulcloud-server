import { Injectable } from '@nestjs/common';
import { ObjectId } from '@mikro-orm/mongodb';
import { SubmissionItem } from './submission-item.do';

@Injectable()
export class SubmissionItemFactory {
	build(): SubmissionItem {
		return new SubmissionItem({
			id: new ObjectId().toHexString(),
			createdAt: new Date(),
			updatedAt: new Date(),
			completed: false,
			userId: new ObjectId().toHexString(),
		});
	}
}
