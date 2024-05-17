import { MediaBoardColors } from '@modules/board/domain';
import { MediaLineNode, type MediaLineNodeProps } from '@shared/domain/entity';
import { BaseFactory } from '../base.factory';

export const mediaLineNodeFactory = BaseFactory.define<MediaLineNode, MediaLineNodeProps>(
	MediaLineNode,
	({ sequence }) => {
		return {
			title: `Line ${sequence}`,
			backgroundColor: MediaBoardColors.TRANSPARENT,
			collapsed: false,
		};
	}
);
