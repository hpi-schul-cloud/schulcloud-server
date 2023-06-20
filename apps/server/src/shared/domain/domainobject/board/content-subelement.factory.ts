import { Injectable, NotImplementedException } from '@nestjs/common';
import { ObjectId } from 'bson';

import { EntityId, SubmissionSubElement } from '@shared/domain';
import { AnyContentSubElementDo } from './types/any-content-subelement-do';
import { ContentSubElementType } from './types/content-subelements.enum';

@Injectable()
export class ContentSubElementFactory {
	build(userId: EntityId, type: ContentSubElementType): AnyContentSubElementDo {
		let subElement!: AnyContentSubElementDo;

		switch (type) {
			case ContentSubElementType.SUBMISSION:
				subElement = this.buildSubmission(userId);
				break;
			default:
				break;
		}

		if (!subElement) {
			throw new NotImplementedException(`unknown type ${type} of element`);
		}

		return subElement;
	}

	private buildSubmission(userId: EntityId) {
		const subElement = new SubmissionSubElement({
			id: new ObjectId().toHexString(),
			completed: false,
			userId,
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		return subElement;
	}
}
