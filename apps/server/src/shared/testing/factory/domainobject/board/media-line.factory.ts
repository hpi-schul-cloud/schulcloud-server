import { ObjectId } from '@mikro-orm/mongodb';
import { MediaLine, MediaLineProps, ROOT_PATH } from '@modules/board/domain';
import { BaseFactory } from '../../base.factory';

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
