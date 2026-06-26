import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { MapElement, MapElementProps, ROOT_PATH } from '../domain';

export const mapElementFactory = BaseFactory.define<MapElement, MapElementProps>(MapElement, () => {
	return {
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
	};
});
