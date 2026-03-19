import { ObjectId } from '@mikro-orm/mongodb';
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
			it('should return identifier with prefix for given ObjectId', () => {
				const identifier = new ObjectId();

				expect(createIdentifier(identifier)).toBe(`i${identifier.toHexString()}`);
			});

			it('should return identifier with prefix for given string', () => {
				const identifier = new ObjectId().toHexString();

				expect(createIdentifier(identifier)).toBe(`i${identifier}`);
			});

			it('should return identifier with prefix for stringified ObjectId', () => {
				const identifier = new ObjectId();
				const serialized = {
					buffer: JSON.parse(JSON.stringify(identifier.id)) as unknown,
				};
				expect(createIdentifier(serialized)).toBe(`i${identifier.toHexString()}`);
			});

			it('should return identifier with prefix for undefined', () => {
				expect(createIdentifier(undefined)).toMatch(/^i[0-9a-f]{24}$/);
			});

			it('should throw when unsupported type is given', () => {
				const identifier = {};

				expect(() => createIdentifier(identifier)).toThrow();
			});
		});
	});
});
