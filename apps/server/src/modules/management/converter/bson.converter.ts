import { Injectable } from '@nestjs/common';
import { EJSON } from 'bson';

@Injectable()
export class BsonConverter {
	/**
	 * Serializes documents from plain JavaScript objects to Extended JSON JavaScript objects.
	 * @param documents mongo-json documents
	 * @returns mongo-bson/ejson objects
	 */
	serialize(documents: unknown[]): unknown[] {
		const bsonDocuments = EJSON.serialize(documents) as unknown[];
		return bsonDocuments;
	}

	/**
	 * Deserializes documents from Extended JSON JavaScript objects to plain JavaScript objects.
	 * @param bsonDocuments mongo-bson/ejson objects
	 * @returns mongo-json documents
	 */
	deserialize(bsonDocuments: unknown[]): unknown[] {
		const jsonDocuments = EJSON.deserialize(bsonDocuments) as unknown[];
		return jsonDocuments;
	}
}
