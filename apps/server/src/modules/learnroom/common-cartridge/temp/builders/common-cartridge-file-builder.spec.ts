import AdmZip from 'adm-zip';
import { CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeFileBuilder } from './common-cartridge-file-builder';

describe('CommonCartridgeFileBuilder', () => {
	let sut: CommonCartridgeFileBuilder;

	const getFileContentAsString = (archive: AdmZip, path: string): string | undefined =>
		archive.getEntry(path)?.getData().toString();

	beforeAll(() => {
		sut = new CommonCartridgeFileBuilder({
			version: CommonCartridgeVersion.V_1_1,
		});
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('build', () => {
		describe('when using version 1.1', () => {
			it('should create imsmanifest.xml in archive root', async () => {
				const archive = new AdmZip(await sut.build());
				const manifest = getFileContentAsString(archive, 'imsmanifest.xml');

				expect(manifest).toBeDefined();
			});

			it('should create metadata section in imsmanifest.xml', async () => {
				const archive = new AdmZip(await sut.build());
				const manifest = getFileContentAsString(archive, 'imsmanifest.xml');

				expect(manifest).toContain('<metadata>');
				expect(manifest).toContain('</metadata>');
			});

			it('should create organization section in imsmanifest.xml', async () => {
				const archive = new AdmZip(await sut.build());
				const manifest = getFileContentAsString(archive, 'imsmanifest.xml');

				expect(manifest).toContain('<organizations>');
				expect(manifest).toContain('</organizations>');
			});

			it('foobar', () => {
				// const builder = new CommonCartridgeFileBuilder(CommonCartridgeVersion.V_1_1);
				// const metadataBuilder = builder.withMetadata();
				// metadataBuilder
				// 	.setTitle('test-title')
				// 	.setCopyrightOwners(['PS', 'SR'])
				// 	.setCreationDate(new Date('2021-01-01'));
				// const organization1Builder = builder.withOrganization();
				// const organization2Builder = builder.withOrganization();
				// organization1Builder.addOrganization()
			});
		});
	});
});
