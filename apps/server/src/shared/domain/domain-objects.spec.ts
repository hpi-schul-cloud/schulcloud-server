import { ObjectId } from '@mikro-orm/mongodb';
import { DomainObject } from './domain-object';
import { EntityId } from './types';

interface MyDomainObjectProps {
	id: EntityId;
	name: string;
}
class MyDomainObject extends DomainObject<MyDomainObjectProps> {}

describe(DomainObject.name, () => {
	describe('when a new implementation of DomainObject is created', () => {
		const setup = () => {
			const id = new ObjectId().toHexString();
			const myProps = { id, name: 'abc' };
			const myDo = new MyDomainObject(myProps);

			return { myDo, myProps };
		};

		it('id getter should exists', () => {
			const { myDo, myProps } = setup();

			expect(myDo.id).toEqual(myProps.id);
		});

		it('should be possible to get the properties over getProps as copy', () => {
			const { myDo, myProps } = setup();

			const props = myDo.getProps();

			expect(props).toEqual(myProps);
			expect(props === myProps).toBe(false);
		});
	});
});
