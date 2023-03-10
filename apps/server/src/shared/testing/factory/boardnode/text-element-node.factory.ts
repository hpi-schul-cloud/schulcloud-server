import { ObjectId } from '@mikro-orm/mongodb';
import { BoardNodeType, TextElementNode, TextElementNodeProps } from '@shared/domain';
import { BaseFactory } from '../base.factory';

export const textElementNodeFactory = BaseFactory.define<TextElementNode, TextElementNodeProps>(
	TextElementNode,
	({ sequence }) => {
		return {
			id: new ObjectId().toHexString(),
			type: BoardNodeType.TEXT_ELEMENT,
			text: `text #${sequence}`,
		};
	}
);
