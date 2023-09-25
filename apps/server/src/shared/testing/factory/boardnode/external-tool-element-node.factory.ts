import { ExternalToolElementNodeEntity, ExternalToolElementNodeEntityProps } from '../../../domain';
import { BaseFactory } from '../base.factory';

export const externalToolElementNodeFactory = BaseFactory.define<
	ExternalToolElementNodeEntity,
	ExternalToolElementNodeEntityProps
>(ExternalToolElementNodeEntity, () => {
	return {};
});
