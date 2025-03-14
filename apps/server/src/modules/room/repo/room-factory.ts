import { Room, RoomProps } from '../domain';
import { ObjectId } from 'bson';

export type RoomParams = Omit<RoomProps, 'id' | 'updatedAt' | 'createdAt'> &
	Partial<Pick<RoomProps, 'id' | 'updatedAt' | 'createdAt'>>;

export class RoomDomainFactory {
	public static build(params: RoomParams): Room {
		const props = {
			id: params.id || new ObjectId().toHexString(),
			createdAt: params.createdAt || new Date(),
			updatedAt: params.updatedAt || new Date(),
			...params,
		};

		return new Room(props);
	}
}
