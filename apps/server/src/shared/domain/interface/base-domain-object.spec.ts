import { BaseDomainObject } from './base-domain-object';

describe('base-domain-object', () => {
	class MyDomainObject extends BaseDomainObject {
		id: string;

		constructor() {
			super();
			this.id = '123';
		}
	}

	it('Should possible to extend the abstract class', () => {
		expect(MyDomainObject).toBeDefined();
	});

	it('Should possible to create a instance of the extender class', () => {
		const domainObject = new MyDomainObject();

		expect(domainObject).toBeDefined();
	});

	it('Should include the id key as reference.', () => {
		const domainObject = new MyDomainObject();

		expect(typeof domainObject.id).toEqual('string');
	});
});
