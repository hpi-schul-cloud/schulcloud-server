import { Injectable } from '@nestjs/common';
import { ObjectId } from 'bson';
import { InputFormat } from '@shared/domain';
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
			caption: '',
			text: '',
			inputFormat: InputFormat.RICH_TEXT_CK5,
		});
	}
}
