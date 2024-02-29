import { InternalServerErrorException } from '@nestjs/common';
import { ObjectID } from 'bson';
import { CommonCartridgeVersion } from './common-cartridge.enums';
import {
	buildXmlString,
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

	describe('checkIntendedUse', () => {
		describe('when intended use is not supported', () => {
			it('should throw error', () => {
				const supportedIntendedUses = ['use1', 'use2'];

				expect(() => checkIntendedUse('use3', supportedIntendedUses)).toThrowError(
					'Intended use use3 is not supported'
				);
			});
		});
	});
});
