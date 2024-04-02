import { type BoardNodeProps, MediaLineNode } from '@shared/domain/entity';
import { BaseFactory } from '../base.factory';

export const mediaLineNodeFactory = BaseFactory.define<MediaLineNode, BoardNodeProps>(MediaLineNode, ({ sequence }) => {
	return {
		title: `Line ${sequence}`,
	};
});
