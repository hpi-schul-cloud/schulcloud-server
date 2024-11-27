import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { MediaExternalToolElement, MediaExternalToolElementProps, ROOT_PATH } from '../domain';

export const mediaExternalToolElementFactory = BaseFactory.define<
	MediaExternalToolElement,
	MediaExternalToolElementProps
>(MediaExternalToolElement, () => {
	const props: MediaExternalToolElementProps = {
		id: new ObjectId().toHexString(),
		path: ROOT_PATH,
		level: 0,
		position: 0,
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
		contextExternalToolId: new ObjectId().toHexString(),
	};

	return props;
});
