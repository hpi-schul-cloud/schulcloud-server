import { ConverterUtil } from '@shared/common';

describe('ConverterUtil', () => {
	let service: ConverterUtil;

	beforeAll(() => {
		service = new ConverterUtil();
	});

	describe('xml2Object', () => {
		it('should map correctly to TestObject', () => {
			const testXml = '<test><array n="nr1">1</array><array n="nr2">2</array><str>test1</str>test2</test>';

			const result = service.xml2object(testXml);

			expect(result).toEqual({
				test: {
					array: [
						{
							n: 'nr1',
							value: 1,
						},
						{
							n: 'nr2',
							value: 2,
						},
					],
					str: 'test1',
					value: 'test2',
				},
			});
		});
	});
});
