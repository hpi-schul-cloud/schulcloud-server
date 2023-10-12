import { ObjectId } from 'bson';

export function createIdentifier(id?: string | ObjectId): string {
	id = id ?? new ObjectId();
	return `i${id.toString()}`;
}
