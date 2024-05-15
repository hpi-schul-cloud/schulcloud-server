import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing/factory';
import { MediaLine, MediaLineProps, ROOT_PATH } from '../domain';

export const mediaLineFactory = BaseFactory.define<MediaLine, MediaLineProps>(MediaLine, ({ sequence }) => {
	const props: MediaLineProps = {
		id: new ObjectId().toHexString(),
		path: ROOT_PATH,
		level: 0,
		title: `Media-Line #${sequence}`,
		position: 0,
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	return props;
});
