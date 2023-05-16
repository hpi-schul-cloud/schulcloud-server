import { toXmlString } from './utils';

describe('CommonCartridgeUtils', () => {
	describe('toXmlString', () => {
		it('should return a xml string', () => {
			const xml = toXmlString({ title: 'Title' });
			expect(xml).toContain('<title>Title</title>');
		});
	});
});
