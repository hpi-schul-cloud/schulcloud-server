import { ObjectId } from '@mikro-orm/mongodb';
import { InputFormat } from '@shared/domain/types';
import { BaseFactory } from '@shared/testing/factory';
import { RichTextElement, RichTextElementProps, ROOT_PATH } from '../domain';

export const richTextElementFactory = BaseFactory.define<RichTextElement, RichTextElementProps>(
	RichTextElement,
	({ sequence }) => {
		return {
			id: new ObjectId().toHexString(),
			path: ROOT_PATH,
			level: 0,
			title: `rich-text #${sequence}`,
			position: 0,
			children: [],
			text: `<p><b>text</b> #${sequence}</p>`,
			inputFormat: InputFormat.RICH_TEXT_CK5,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
);
