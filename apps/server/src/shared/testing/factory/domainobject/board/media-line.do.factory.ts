import { ObjectId } from '@mikro-orm/mongodb';
import { AnyMediaBoardDo, type MediaBoardProps, MediaLine, type MediaLineProps } from '@shared/domain/domainobject';
import { DeepPartial } from 'fishery';
import { BaseFactory } from '../../base.factory';

class MediaLineFactory extends BaseFactory<MediaLine, MediaLineProps> {
	addChild(child: AnyMediaBoardDo): this {
		const params: DeepPartial<MediaBoardProps> = { children: [child] };

		return this.params(params);
	}
}

export const mediaLineFactory = MediaLineFactory.define(MediaLine, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
		title: `Line ${sequence}`,
		backgroundColor: '#ffffff',
		collapsed: false,
	};
});
