import { InternalServerErrorException } from '@nestjs/common';
import { ObjectID } from 'bson';
import { CommonCartridgeVersion } from './common-cartridge.enums';
import {
	buildXmlString,
	checkDefined,
	checkIntendedUse,
	createElementTypeNotSupportedError,
	createIdentifier,
	createResourceTypeNotSupportedError,
	createVersionNotSupportedError,
} from './utils';

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

				expect(error).toBeInstanceOf(InternalServerErrorException);
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

	describe('createIdentifier', () => {
		describe('when creating identifier', () => {
			it('should return identifier with prefix', () => {
				const identifier = new ObjectID();

				expect(createIdentifier(identifier)).toBe(`i${identifier.toHexString()}`);
			});

			it('should return identifier with prefix when identifier is undefined', () => {
				expect(createIdentifier(undefined)).toMatch(/^i[0-9a-f]{24}$/);
			});
		});
	});

	describe('createResourceTypeNotSupportedError', () => {
		describe('when creating error', () => {
			it('should return error with message', () => {
				const resourceType = 'unsupported';
				const error = createResourceTypeNotSupportedError(resourceType);

				expect(error).toBeInstanceOf(InternalServerErrorException);
				expect(error.message).toBe(`Common Cartridge resource type ${resourceType} is not supported`);
			});
		});
	});

	describe('createElementTypeNotSupportedError', () => {
		describe('when creating error', () => {
			it('should return error with message', () => {
				const elementType = 'unsupported';
				const error = createElementTypeNotSupportedError(elementType);

				expect(error).toBeInstanceOf(InternalServerErrorException);
				expect(error.message).toBe(`Common Cartridge element type ${elementType} is not supported`);
			});
		});
	});
});
