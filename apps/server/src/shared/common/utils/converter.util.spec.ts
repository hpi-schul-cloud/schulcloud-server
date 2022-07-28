import { ConverterUtil } from '@shared/common';

class TestObject {
	test: string;

	constructor(test: string) {
		this.test = test;
	}
}
describe('ConverterUtil', () => {
	let service: ConverterUtil;
	beforeAll(() => {
		service = new ConverterUtil();
	});
	describe('xml2Object', () => {
		it('should map correctly to TestObject', () => {
			const test = '<test>test</test>';
			const ret = service.xml2object<TestObject>(test);
			expect(ret.test).toEqual('test');
		});
	});
});
