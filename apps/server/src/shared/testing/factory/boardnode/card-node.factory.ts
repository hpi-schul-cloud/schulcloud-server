/* istanbul ignore file */
import { CardNode, CardNodeProps } from '@shared/domain';
import { BaseFactory } from '../base.factory';

export const cardNodeFactory = BaseFactory.define<CardNode, CardNodeProps>(CardNode, ({ sequence }) => {
	return {
		height: 150,
		title: `card #${sequence}`,
	};
});
