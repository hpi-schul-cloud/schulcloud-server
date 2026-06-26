import { ObjectId } from '@mikro-orm/mongodb';
import { BoardNodeType, MapElementProps, ROOT_PATH } from '../../domain';
import { BoardNodeEntityFactory, PropsWithType } from './board-node-entity.factory';

export const mapElementEntityFactory = BoardNodeEntityFactory.define<PropsWithType<MapElementProps>>(() => {
	const props: PropsWithType<MapElementProps> = {
		id: new ObjectId().toHexString(),
		path: ROOT_PATH,
		level: 0,
		position: 0,
		children: [],
		centerLat: 51.5,
		centerLng: 10.0,
		zoom: 10,
		features: '{"type":"FeatureCollection","features":[]}',
		createdAt: new Date(),
		updatedAt: new Date(),
		type: BoardNodeType.MAP_ELEMENT,
	};

	return props;
});
