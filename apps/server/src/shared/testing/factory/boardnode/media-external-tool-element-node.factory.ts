import { contextExternalToolEntityFactory } from '@modules/tool/context-external-tool/testing';
import { MediaExternalToolElementNode, type MediaExternalToolElementNodeProps } from '@shared/domain/entity';
import { BaseFactory } from '../base.factory';

export const mediaExternalToolElementNodeFactory = BaseFactory.define<
	MediaExternalToolElementNode,
	MediaExternalToolElementNodeProps
>(MediaExternalToolElementNode, () => {
	return {
		contextExternalTool: contextExternalToolEntityFactory.build(),
	};
});
