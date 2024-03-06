/* istanbul ignore file */
import { RichTextElement, RichTextElementProps } from '@shared/domain/domainobject';
import { InputFormat } from '@shared/domain/types';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '../../base.factory';

export const richTextElementFactory = BaseFactory.define<RichTextElement, RichTextElementProps>(
	RichTextElement,
	({ sequence }) => {
		return {
			id: new ObjectId().toHexString(),
			title: `element #${sequence}`,
			children: [],
			text: `<p><b>text</b> #${sequence}</p>`,
			inputFormat: InputFormat.RICH_TEXT_CK5,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
);
