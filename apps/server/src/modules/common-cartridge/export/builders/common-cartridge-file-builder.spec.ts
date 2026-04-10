import { Logger } from '@core/logger';
import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import archiver from 'archiver';
import {
	createCommonCartridgeMetadataElementProps,
	createCommonCartridgeOrganizationProps,
} from '../../testing/common-cartridge-element-props.factory';
import {
	createCommonCartridgeFileProps,
	createCommonCartridgeFileFolderResourcePropsV130,
	createCommonCartridgeWebLinkResourceProps,
} from '../../testing/common-cartridge-resource-props.factory';
import { CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeElementFactory } from '../elements/common-cartridge-element-factory';
import { MissingMetadataLoggableException } from '../errors';
import { CommonCartridgeFileBuilder, CommonCartridgeFileBuilderProps } from './common-cartridge-file-builder';
import { CommonCartridgeOrganizationNode } from './common-cartridge-organization-node';

describe('CommonCartridgeFileBuilder', () => {
	let sut: CommonCartridgeFileBuilder;
	let archive: DeepMocked<archiver.Archiver>;
	let logger: DeepMocked<Logger>;

	const builderProps: CommonCartridgeFileBuilderProps = {
		version: CommonCartridgeVersion.V_1_3_0,
		identifier: faker.string.uuid(),
	};

	beforeEach(() => {
		archive = createMock<archiver.Archiver>();
		logger = createMock<Logger>();
		sut = new CommonCartridgeFileBuilder(builderProps, archive, logger);
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
			const setup = () => {
				const organizationProps = createCommonCartridgeOrganizationProps();

				return { organizationProps };
			};

			it('should create and return an organization node', () => {
				const { organizationProps } = setup();

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
			const setup = () => {
				const metadataProps = createCommonCartridgeMetadataElementProps();
				const organizationProps = createCommonCartridgeOrganizationProps();
				const webLinkProps = createCommonCartridgeWebLinkResourceProps();
				const fileProps = createCommonCartridgeFileProps();
				const fileFolderProps = createCommonCartridgeFileFolderResourcePropsV130();

				return { metadataProps, organizationProps, webLinkProps, fileProps, fileFolderProps };
			};

			it('should build the common cartridge file', () => {
				const { metadataProps, organizationProps, webLinkProps, fileProps, fileFolderProps } = setup();

				sut.addMetadata(metadataProps);

				const org = sut.createOrganization(organizationProps);

				org.addResource(webLinkProps);
				org.addResource(fileProps);
				org.addResource(fileFolderProps);

				expect(() => sut.build()).not.toThrow();

				expect(archive.append).toHaveBeenCalledTimes(4);
				expect(archive.finalize).toHaveBeenCalled();
			});
		});
	});
});
