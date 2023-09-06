import { ObjectId } from '@mikro-orm/mongodb';
import { MethodNotAllowedException } from '@nestjs/common';
import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { DomainObjectFactory } from './domain-object.factory';

class TestClass extends DomainObject<AuthorizableObject> {}

const testFactory = DomainObjectFactory.define<TestClass, AuthorizableObject>(TestClass, () => {
	return {
		id: new ObjectId().toHexString(),
	};
});

describe('DomainObjectFactory', () => {
	describe('buildWithId', () => {
		it('should throw not allowed', () => {
			const id = 'id';

			const func = () => testFactory.buildWithId(undefined, id);

			expect(func).toThrow(MethodNotAllowedException);
		});
	});
});
