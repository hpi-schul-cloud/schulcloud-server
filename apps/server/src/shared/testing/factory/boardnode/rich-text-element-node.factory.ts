/* istanbul ignore file */
import { InputFormat, RichTextNode, RichTextNodeProps } from '@shared/domain';
import { BaseFactory } from '../base.factory';

export const richTextElementNodeFactory = BaseFactory.define<RichTextNode, RichTextNodeProps>(
	RichTextNode,
	({ sequence }) => {
		return {
			text: `<p><b>text</b> #${sequence}</p>`,
			inputFormat: InputFormat.RICH_TEXT_CK5,
		};
	}
);
