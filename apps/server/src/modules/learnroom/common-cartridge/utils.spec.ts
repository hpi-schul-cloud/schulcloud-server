import { CommonCartridgeVersion } from './common-cartridge.enums';
import { buildXmlString, checkCommonCartridgeVersion, checkDefined, createVersionNotSupportedError } from './utils';

describe('CommonCartridgeUtils', () => {
	describe('buildXmlString', () => {
		it('should create xml string', () => {
			const xml = buildXmlString({ root: { child: 'value' } });

			expect(xml).toBe('<root>\n  <child>value</child>\n</root>');
		});
	});

	describe('createVersionNotSupportedError', () => {
		describe('when creating error', () => {
			it('should return error with message', () => {
				const error = createVersionNotSupportedError(CommonCartridgeVersion.V_1_0_0);

				expect(error).toBeDefined();
				expect(error.message).toBe('Version 1.0.0 is not supported');
			});
		});
	});

	// AI next 12 lines
	describe('checkCommonCartridgeVersion', () => {
		describe('when checking version', () => {
			it('should not throw error when version is supported', () => {
				expect(() => checkCommonCartridgeVersion(CommonCartridgeVersion.V_1_1_0)).not.toThrow();
			});

			it('should throw error when version is not supported', () => {
				expect(() => checkCommonCartridgeVersion(CommonCartridgeVersion.V_1_0_0)).toThrow(
					createVersionNotSupportedError(CommonCartridgeVersion.V_1_0_0)
				);
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
});
