import { TextElementNode, TextElementNodeProperties } from '@shared/domain';
import { BaseFactory } from '../base.factory';

export const textElementNodeFactory = BaseFactory.define<TextElementNode, TextElementNodeProperties>(
	TextElementNode,
	({ sequence }) => {
		return {
			text: `<p>text #${sequence}`,
		};
	}
);
