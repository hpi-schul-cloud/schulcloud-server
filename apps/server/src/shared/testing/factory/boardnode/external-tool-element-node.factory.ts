import { ExternalToolElementNodeEntity, ExternalToolElementNodeEntityProps } from '@shared/domain/entity';
import { BaseFactory } from '../base.factory';

export const externalToolElementNodeFactory = BaseFactory.define<
	ExternalToolElementNodeEntity,
	ExternalToolElementNodeEntityProps
>(ExternalToolElementNodeEntity, () => {
	return {};
});
