import { createCommonCartridgeMetadataElementPropsV110 } from '../testing/common-cartridge-element-props.factory';
import { createCommonCartridgeWeblinkResourcePropsV110 } from '../testing/common-cartridge-resource-props.factory';
import { CommonCartridgeGuard } from './common-cartridge.guard';
import { CommonCartridgeElementFactory } from './elements/common-cartridge-element-factory';
import { CommonCartridgeResourceFactory } from './resources/common-cartridge-resource-factory';

describe('CommonCartridgeGuard', () => {
	describe('checkIntendedUse', () => {
		describe('when intended use is supported', () => {
			const supportedIntendedUses = ['use1', 'use2', 'use3'];

			it('should not throw an exception', () => {
				const intendedUse = 'use1';

				expect(() => {
					CommonCartridgeGuard.checkIntendedUse(intendedUse, supportedIntendedUses);
				}).not.toThrow();
			});
		});

		describe('when intended use is not supported', () => {
			const supportedIntendedUses = ['use1', 'use2', 'use3'];

			it('should throw an exception', () => {
				const intendedUse = 'use4';

				expect(() => {
					CommonCartridgeGuard.checkIntendedUse(intendedUse, supportedIntendedUses);
				}).toThrow();
			});
		});
	});

	describe('isResource', () => {
		describe('when element is a resource', () => {
			const setup = () => {
				const props = createCommonCartridgeWeblinkResourcePropsV110();
				const element = CommonCartridgeResourceFactory.createResource(props);

				return { element };
			};

			it('should return true', () => {
				const { element } = setup();

				const result = CommonCartridgeGuard.isResource(element);

				expect(result).toBe(true);
			});
		});

		describe('when element is not a resource', () => {
			const setup = () => {
				const props = createCommonCartridgeMetadataElementPropsV110();
				const element = CommonCartridgeElementFactory.createElement(props);

				return { element };
			};

			it('should return false', () => {
				const { element } = setup();

				const result = CommonCartridgeGuard.isResource(element);

				expect(result).toBe(false);
			});
		});
	});
});
