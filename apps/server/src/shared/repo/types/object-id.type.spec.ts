import { Platform } from '@mikro-orm/core';
import { MongoPlatform, ObjectId } from '@mikro-orm/mongodb';
import { ObjectIdType } from './object-id.type';

class InvalidPlatform extends Platform {}

describe(ObjectIdType.name, () => {
	describe('convertToDatabaseValue', () => {
		const setup = () => {
			const propType = new ObjectIdType();
			const platform = new MongoPlatform();
			const invalidPlatform = new InvalidPlatform();
			const entityId = new ObjectId().toHexString();
			const invalidEntityId = 'foobar';

			return { propType, platform, invalidPlatform, entityId, invalidEntityId };
		};

		describe('with valid entity id', () => {
			it('should convert to mongo id', () => {
				const { propType, platform, entityId } = setup();

				const id = propType.convertToDatabaseValue(entityId, platform);

				expect(id).toBeInstanceOf(ObjectId);
				expect(id.toHexString()).toBe(entityId);
			});
		});

		describe('with invalid entity id', () => {
			it('should throw error', () => {
				const { propType, platform, invalidEntityId } = setup();

				const conversion = () => propType.convertToDatabaseValue(invalidEntityId, platform);

				expect(conversion).toThrowError();
			});
		});

		describe('when platform is invalid', () => {
			it('should throw error', () => {
				const { propType, invalidPlatform, entityId } = setup();

				const conversion = () => propType.convertToDatabaseValue(entityId, invalidPlatform);

				expect(conversion).toThrowError();
			});
		});
	});

	describe('convertToJSValue', () => {
		const setup = () => {
			const propType = new ObjectIdType();
			const platform = new MongoPlatform();
			const invalidPlatform = new InvalidPlatform();
			const objectId = new ObjectId();

			return { propType, platform, invalidPlatform, objectId };
		};

		it('should return entity id', () => {
			const { propType, platform, objectId } = setup();

			const entityId = propType.convertToJSValue(objectId, platform);

			expect(entityId).toBe(objectId.toHexString());
		});

		describe('when platform is invalid', () => {
			it('should throw error', () => {
				const { propType, invalidPlatform, objectId } = setup();

				const conversion = () => propType.convertToJSValue(objectId, invalidPlatform);

				expect(conversion).toThrowError();
			});
		});
	});
});
