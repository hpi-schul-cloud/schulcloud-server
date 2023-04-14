import { InputFormat, RichText, RichTextCardElement, TitleCardElement } from '@shared/domain';
import { BaseEntityTestFactory } from './base-entity-test.factory';

export const titleCardElementFactory = BaseEntityTestFactory.define<TitleCardElement, string>(
	TitleCardElement,
	({ sequence }) => `title card element #${sequence}`
);

export const richTextCardElementFactory = BaseEntityTestFactory.define<RichTextCardElement, RichText>(
	RichTextCardElement,
	({ sequence }) => {
		const richText = new RichText({
			type: InputFormat.RICH_TEXT_CK5,
			content: `rich text ck5 card element #${sequence}`,
		});
		return richText;
	}
);
