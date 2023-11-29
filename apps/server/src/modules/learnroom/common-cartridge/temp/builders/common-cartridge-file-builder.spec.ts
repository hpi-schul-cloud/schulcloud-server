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
		describe('when using version 1.1.0', () => {
			it('should create imsmanifest.xml in archive root', async () => {
				const archive = new AdmZip(await sut.build());
				const manifest = getFileContentAsString(archive, 'imsmanifest.xml');

				expect(manifest).toBeDefined();
			});

			it('should create manifest section in imsmanifest.xml', async () => {
				const archive = new AdmZip(await sut.build());
				const manifest = getFileContentAsString(archive, 'imsmanifest.xml');

				expect(manifest).toContain('<manifest>');
				expect(manifest).toContain('</manifest>');
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

			it('should create resources section in imsmanifest.xml', async () => {
				const archive = new AdmZip(await sut.build());
				const manifest = getFileContentAsString(archive, 'imsmanifest.xml');

				expect(manifest).toContain('<resources>');
				expect(manifest).toContain('</resources>');
			});
		});
	});
});
