import { DeepMocked, createMock } from '@golevelup/ts-jest';
import AdmZip from 'adm-zip';
import { readFile } from 'node:fs/promises';
import { CommonCartridgeResourceFactory } from './common-cartridge-resource-factory';

describe('CommonCartridgeResourceFactory', () => {
	let sut: CommonCartridgeResourceFactory;
	let admZipMock: DeepMocked<AdmZip>;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const setupWebLinkXml = async () => {
		let webLinkXml: string | undefined;

		if (!webLinkXml) {
			webLinkXml = await readFile(
				'./apps/server/src/modules/common-cartridge/testing/assets/v1.1.0/weblink.xml',
				'utf-8'
			);

			return webLinkXml;
		}

		return webLinkXml;
	};

	beforeAll(() => {
		admZipMock = createMock<AdmZip>();
		sut = new CommonCartridgeResourceFactory(admZipMock);
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe.skip('create', () => {
		describe('when creating a web link resource', () => {});
	});
});
