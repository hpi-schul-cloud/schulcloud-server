import { faker } from '@faker-js/faker';
import {
	createCommonCartridgeMetadataElementProps,
	createCommonCartridgeOrganizationProps,
} from '../../testing/common-cartridge-element-props.factory';
import { createCommonCartridgeWebLinkResourceProps } from '../../testing/common-cartridge-resource-props.factory';
import { CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeElementFactory } from '../elements/common-cartridge-element-factory';
import { MissingMetadataLoggableException } from '../errors';
import { CommonCartridgeFileBuilder, CommonCartridgeFileBuilderProps } from './common-cartridge-file-builder';
import { CommonCartridgeOrganizationNode } from './common-cartridge-organization-node';

describe('CommonCartridgeFileBuilder', () => {
	let sut: CommonCartridgeFileBuilder;

	const builderProps: CommonCartridgeFileBuilderProps = {
		version: CommonCartridgeVersion.V_1_1_0,
		identifier: faker.string.uuid(),
	};

	const setupProps = () => {
		const metadataProps = createCommonCartridgeMetadataElementProps();
		const organizationProps = createCommonCartridgeOrganizationProps();
		const resourceProps = createCommonCartridgeWebLinkResourceProps();

		return { metadataProps, organizationProps, resourceProps };
	};

	beforeEach(() => {
		sut = new CommonCartridgeFileBuilder(builderProps);
		jest.clearAllMocks();
	});

	describe('addMetadata', () => {
		describe('when metadata is added to the CommonCartridgeFileBuilder', () => {
			const setup = () => {
				const createElementSpy = jest.spyOn(CommonCartridgeElementFactory, 'createElement');
				const metadataProps = createCommonCartridgeMetadataElementProps();

				return { metadataProps, createElementSpy };
			};

			it('should set the metadata element', () => {
				const { metadataProps, createElementSpy } = setup();

				sut.addMetadata(metadataProps);

				expect(createElementSpy).toHaveBeenCalledWith({ ...metadataProps, version: builderProps.version });
			});
		});
	});

	describe('createOrganization', () => {
		describe('when an organization is created in the CommonCartridgeFileBuilder', () => {
			/* 			const setup = () => {
				const organizationProps = createCommonCartridgeOrganizationProps();

				return { organizationProps };
			}; */

			it('should create and return an organization node', () => {
				const { organizationProps } = setupProps();

				const organizationNode = sut.createOrganization(organizationProps);

				expect(organizationNode).toBeInstanceOf(CommonCartridgeOrganizationNode);
			});
		});
	});

	describe('build', () => {
		describe('when metadata has not been provided', () => {
			it('should throw MissingMetadataLoggableException', () => {
				expect(() => {
					sut.build();
				}).toThrow(MissingMetadataLoggableException);
			});
		});

		describe('when metadata has been provided', () => {
			/* const setup = () => {
				const metadataProps = createCommonCartridgeMetadataElementProps();
				const organizationProps = createCommonCartridgeOrganizationProps();
				const resourceProps = createCommonCartridgeWebLinkResourceProps();

				return { metadataProps, organizationProps, resourceProps };
			};
 */
			it('should build the common cartridge file', () => {
				const { metadataProps, organizationProps, resourceProps } = setupProps();

				sut.addMetadata(metadataProps);

				const org = sut.createOrganization(organizationProps);

				org.addResource(resourceProps);

				const result = sut.build();

				expect(result).toBeDefined();
			});
		});
	});
});
