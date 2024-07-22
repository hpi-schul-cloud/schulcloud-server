import { ObjectId } from 'bson';
import { buildXmlString, createIdentifier } from './utils';

describe('CommonCartridgeUtils', () => {
	describe('buildXmlString', () => {
		it('should create xml string', () => {
			const xml = buildXmlString({ root: { child: 'value' } });

			expect(xml).toBe('<?xml version="1.0" encoding="UTF-8"?>\n<root>\n    <child>value</child>\n</root>');
		});
	});

	describe('createIdentifier', () => {
		describe('when creating identifier', () => {
			it('should return identifier with prefix', () => {
				const identifier = new ObjectId();

				expect(createIdentifier(identifier)).toBe(`i${identifier.toHexString()}`);
			});

			it('should return identifier with prefix when identifier is undefined', () => {
				expect(createIdentifier(undefined)).toMatch(/^i[0-9a-f]{24}$/);
			});
		});
	});
});
