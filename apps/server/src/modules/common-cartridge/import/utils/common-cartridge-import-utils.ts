import AdmZip from 'adm-zip';

export class CommonCartridgeImportUtils {
	public static getManifestFileAsString(archive: AdmZip): string | undefined {
		// imsmanifest.xml is the standard name, but manifest.xml is also valid until v1.3
		const manifest = archive.getEntry('imsmanifest.xml') || archive.getEntry('manifest.xml');

		if (manifest) {
			return archive.readAsText(manifest);
		}

		return undefined;
	}
}
