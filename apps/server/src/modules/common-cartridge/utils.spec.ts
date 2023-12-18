import { CommonCartridgeVersion } from './common-cartridge.enums';
import { buildXmlString, checkDefined, checkIntendedUse, createVersionNotSupportedError } from './utils';

describe('CommonCartridgeUtils', () => {
	describe('buildXmlString', () => {
		it('should create xml string', () => {
			const xml = buildXmlString({ root: { child: 'value' } });

			expect(xml).toBe('<?xml version="1.0" encoding="UTF-8"?>\n<root>\n    <child>value</child>\n</root>');
		});
	});

	describe('createVersionNotSupportedError', () => {
		describe('when creating error', () => {
			it('should return error with message', () => {
				const error = createVersionNotSupportedError(CommonCartridgeVersion.V_1_0_0);

				expect(error).toBeDefined();
				expect(error.message).toBe('Common Cartridge version 1.0.0 is not supported');
			});
		});
	});

	// AI next 16 lines
	describe('checkDefined', () => {
		describe('when checking value', () => {
			it('should return value when value is defined', () => {
				const value = 'value';

				expect(checkDefined(value, 'value')).toBe(value);
			});

			it('should throw error when value is undefined', () => {
				expect(() => checkDefined(undefined, 'value')).toThrow(new Error('value is null or undefined'));
			});

			it('should throw error when value is null', () => {
				expect(() => checkDefined(null, 'value')).toThrow(new Error('value is null or undefined'));
			});
		});
	});

	describe('checkIntendedUse', () => {
		describe('when checking supported intended use', () => {
			it('should not throw', () => {
				const intendedUse = 'unspecified';

				expect(() => checkIntendedUse(intendedUse, ['unspecified'])).not.toThrow();
			});

			it('should throw error when intended use is not supported', () => {
				const intendedUse = 'unsupported';

				expect(() => checkIntendedUse(intendedUse, [])).toThrow(`Intended use ${intendedUse} is not supported`);
			});
		});
	});
});
