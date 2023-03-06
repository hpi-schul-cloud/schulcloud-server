import { CardNode, CardNodeProperties } from '@shared/domain';
import { BaseFactory } from '../base.factory';

export const cardNodeFactory = BaseFactory.define<CardNode, CardNodeProperties>(CardNode, ({ sequence }) => {
	return {
		height: 150,
		title: `card #${sequence}`,
	};
});
