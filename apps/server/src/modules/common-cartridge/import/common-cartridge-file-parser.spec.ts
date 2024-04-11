import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import AdmZip from 'adm-zip';
import { readFile } from 'node:fs/promises';
import { CommonCartridgeFileParser } from './common-cartridge-file-parser';
import { CommonCartridgeResourceTypeV1P1 } from './common-cartridge-import.enums';
import { CommonCartridgeOrganizationProps, CommonCartridgeResourceProps } from './common-cartridge-import.types';
import { CommonCartridgeManifestParser } from './common-cartridge-manifest-parser';
import { CommonCartridgeResourceFactory } from './common-cartridge-resource-factory';
import { CommonCartridgeManifestNotFoundException } from './utils/common-cartridge-manifest-not-found.exception';
import { CommonCartridgeResourceNotFoundException } from './utils/common-cartridge-resource-not-found.exception';

describe('CommonCartridgeFileParser', () => {
	let sut: CommonCartridgeFileParser;
	let manifestParserMock: DeepMocked<CommonCartridgeManifestParser>;
	let admZipMock: DeepMocked<AdmZip>;
	let resourceFactoryMock: DeepMocked<CommonCartridgeResourceFactory>;

	const setupOrganizationProps = () => {
		const organizationProps: CommonCartridgeOrganizationProps = {
			identifier: faker.string.uuid(),
			identifierRef: faker.string.uuid(),
			title: faker.lorem.sentence(),
			path: faker.system.filePath(),
			pathDepth: faker.number.int({ min: 1, max: 5 }),
			isResource: true,
			isInlined: false,
			resourcePath: faker.system.filePath(),
			resourceType: faker.lorem.word(),
		};

		return { organizationProps };
	};

	beforeAll(() => {
		const archive = new AdmZip();

		archive.addFile('imsmanifest.xml', Buffer.from('<manifest></manifest>'));

		sut = new CommonCartridgeFileParser(archive.toBuffer());
		manifestParserMock = createMock<CommonCartridgeManifestParser>();
		admZipMock = createMock<AdmZip>();
		resourceFactoryMock = createMock<CommonCartridgeResourceFactory>();

		Reflect.set(sut, 'manifestParser', manifestParserMock);
		Reflect.set(sut, 'archive', admZipMock);
		Reflect.set(sut, 'resourceFactory', resourceFactoryMock);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('constructor', () => {
		describe('when manifest file is found', () => {
			const setup = async () => {
				const archive = new AdmZip();
				const manifest = await readFile(
					'./apps/server/src/modules/common-cartridge/testing/assets/v1.1.0/manifest.xml'
				);

				archive.addFile('imsmanifest.xml', manifest);

				const file = archive.toBuffer();

				return { file };
			};

			it('should create instance', async () => {
				const { file } = await setup();

				expect(() => new CommonCartridgeFileParser(file)).not.toThrow();
			});
		});

		describe('when manifest file is not found', () => {
			const setup = () => {
				const archive = new AdmZip();
				const file = archive.toBuffer();

				return { file };
			};

			it('should throw CommonCartridgeManifestNotFoundException', () => {
				const { file } = setup();

				expect(() => new CommonCartridgeFileParser(file)).toThrow(CommonCartridgeManifestNotFoundException);
			});
		});
	});

	describe('getSchema', () => {
		describe('when accessing schema', () => {
			const setup = () => {
				manifestParserMock.getSchema.mockReturnValue('IMS Common Cartridge');
			};

			it('should return schema', () => {
				setup();

				const schema = sut.getSchema();

				expect(schema).toEqual('IMS Common Cartridge');
				expect(manifestParserMock.getSchema).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('getVersion', () => {
		describe('when accessing version', () => {
			const setup = () => {
				manifestParserMock.getVersion.mockReturnValue('1.1.0');
			};

			it('should return version', () => {
				setup();

				const version = sut.getVersion();

				expect(version).toEqual('1.1.0');
				expect(manifestParserMock.getVersion).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('getTitle', () => {
		describe('when accessing title', () => {
			const setup = () => {
				manifestParserMock.getTitle.mockReturnValue('Common Cartridge Manifest');
			};

			it('should return title', () => {
				setup();

				const title = sut.getTitle();

				expect(title).toEqual('Common Cartridge Manifest');
				expect(manifestParserMock.getTitle).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('getOrganizations', () => {
		describe('when accessing organizations', () => {
			const setup = () => {
				manifestParserMock.getOrganizations.mockReturnValue([]);
			};

			it('should return organizations', () => {
				setup();

				const organizations = sut.getOrganizations();

				expect(organizations).toEqual([]);
				expect(manifestParserMock.getOrganizations).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('getResource', () => {
		describe('when accessing existing resource', () => {
			const setup = () => {
				const resource: CommonCartridgeResourceProps = {
					type: CommonCartridgeResourceTypeV1P1.UNKNOWN,
				};

				admZipMock.getEntry.mockReturnValue({} as AdmZip.IZipEntry);
				admZipMock.readAsText.mockReturnValue(faker.lorem.paragraph());
				resourceFactoryMock.create.mockReturnValue(resource);

				return setupOrganizationProps();
			};

			it('should return resource', () => {
				const { organizationProps } = setup();

				const resource = sut.getResource(organizationProps);

				expect(resource).toEqual(expect.any(Object));
				expect(admZipMock.getEntry).toHaveBeenCalledTimes(1);
				expect(resourceFactoryMock.create).toHaveBeenCalledTimes(1);
			});
		});

		describe('when accessing non-existing resource', () => {
			const setup = () => {
				admZipMock.getEntry.mockReturnValue(null);

				return setupOrganizationProps();
			};

			it('should throw CommonCartridgeResourceNotFoundException', () => {
				const { organizationProps } = setup();

				expect(() => sut.getResource(organizationProps)).toThrow(CommonCartridgeResourceNotFoundException);
				expect(admZipMock.getEntry).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('getResourceAsString', () => {
		describe('when accessing existing resource', () => {
			const setup = () => {
				admZipMock.getEntry.mockReturnValue({} as AdmZip.IZipEntry);
				admZipMock.readAsText.mockReturnValue(faker.lorem.paragraph());

				return setupOrganizationProps();
			};

			it('should return resource as string', () => {
				const { organizationProps } = setup();

				const resource = sut.getResourceAsString(organizationProps);

				expect(resource).toEqual(expect.any(String));
				expect(admZipMock.getEntry).toHaveBeenCalledTimes(1);
				expect(admZipMock.readAsText).toHaveBeenCalledTimes(1);
			});
		});

		describe('when accessing non-existing resource', () => {
			const setup = () => {
				admZipMock.getEntry.mockReturnValue(null);
				admZipMock.readAsText.mockReturnValue('');

				return setupOrganizationProps();
			};

			it('should throw CommonCartridgeResourceNotFoundException', () => {
				const { organizationProps } = setup();

				expect(() => sut.getResourceAsString(organizationProps)).toThrow(CommonCartridgeResourceNotFoundException);
				expect(admZipMock.getEntry).toHaveBeenCalledTimes(1);
			});
		});
	});
});
