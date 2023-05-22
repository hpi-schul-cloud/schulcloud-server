/* istanbul ignore file */
import { InputFormat, RichTextElement, RichTextElementProps } from '@shared/domain';
import { ObjectId } from 'bson';
import { BaseFactory } from '../../base.factory';

export const richTextElementFactory = BaseFactory.define<RichTextElement, RichTextElementProps>(
	RichTextElement,
	({ sequence }) => {
		return {
			id: new ObjectId().toHexString(),
			title: `element #${sequence}`,
			children: [],
			text: `<p>text #${sequence}</p>`,
			inputFormat: InputFormat.RICH_TEXT_CK5,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
);
