import { ObjectId } from '@mikro-orm/mongodb';

export function createIdentifier(id?: string | ObjectId): string {
	id = id ?? new ObjectId();
	return `i${id.toString()}`;
}
