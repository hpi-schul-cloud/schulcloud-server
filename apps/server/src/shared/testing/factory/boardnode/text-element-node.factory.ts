import { TextElementNode, TextElementNodeProps } from '@shared/domain';
import { BaseFactory } from '../base.factory';

export const textElementNodeFactory = BaseFactory.define<TextElementNode, TextElementNodeProps>(
	TextElementNode,
	({ sequence }) => {
		return {
			text: `<p>text #${sequence}`,
		};
	}
);
