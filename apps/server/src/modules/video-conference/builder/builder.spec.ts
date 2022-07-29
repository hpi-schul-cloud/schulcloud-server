import { Builder } from '@src/modules/video-conference/builder/builder';

interface TestObject {
	test: string;
}

describe('Builder', () => {
	it('should build generic Object', () => {
		const builder = new Builder<TestObject>({
			test: 'test',
		});
		expect(builder.build().test).toEqual('test');
	});
});
