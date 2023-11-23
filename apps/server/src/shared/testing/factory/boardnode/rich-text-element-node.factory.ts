/* istanbul ignore file */
import { RichTextElementNode, RichTextElementNodeProps } from '@shared/domain';
import { InputFormat } from '@shared/domain/types';
import { BaseFactory } from '../base.factory';

export const richTextElementNodeFactory = BaseFactory.define<RichTextElementNode, RichTextElementNodeProps>(
	RichTextElementNode,
	({ sequence }) => {
		return {
			text: `<p><b>text</b> #${sequence}</p>`,
			inputFormat: InputFormat.RICH_TEXT_CK5,
		};
	}
);
