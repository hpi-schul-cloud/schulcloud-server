/* istanbul ignore file */
import { TextElement, TextElementProps } from '@shared/domain';
import { ObjectId } from 'bson';
import { BaseFactory } from '../../base.factory';

export const textElementFactory = BaseFactory.define<TextElement, TextElementProps>(TextElement, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		title: `element #${sequence}`,
		text: `<p>text #${sequence}</p>`,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});
