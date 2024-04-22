import AdmZip from 'adm-zip';
import { CommonCartridgeImportUtils } from './common-cartridge-import-utils';

describe('CommonCartridgeImportUtils', () => {
	const setupArchive = (manifestName: string) => {
		const archive = new AdmZip();

		archive.addFile(manifestName, Buffer.from('<manifest></manifest>'));

		return { archive };
	};

	describe('getManifestFileAsString', () => {
		describe('when manifest file is named imsmanifest.xml', () => {
			const setup = () => setupArchive('imsmanifest.xml');

			it('should return manifest file as string', () => {
				const { archive } = setup();

				const manifest = CommonCartridgeImportUtils.getManifestFileAsString(archive);

				expect(manifest).toBeDefined();
			});
		});

		describe('when manifest file is named manifest.xml', () => {
			const setup = () => setupArchive('manifest.xml');

			it('should return manifest ', () => {
				const { archive } = setup();

				const manifest = CommonCartridgeImportUtils.getManifestFileAsString(archive);

				expect(manifest).toBeDefined();
			});
		});

		describe('when manifest file is not found', () => {
			const setup = () => setupArchive('not-manifest.xml');

			it('should return undefined', () => {
				const { archive } = setup();

				const manifest = CommonCartridgeImportUtils.getManifestFileAsString(archive);

				expect(manifest).toBeUndefined();
			});
		});
	});
});
