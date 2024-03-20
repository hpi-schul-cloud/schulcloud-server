import AdmZip from 'adm-zip';
import { CommonCartridgeFileParser } from './common-cartridge-file-parser';

describe('CommonCartridgeFileParser', () => {
	describe('constructor', () => {
		describe('when manifest file is found', () => {
			const setup = (manifestName: string) => {
				const archive = new AdmZip();

				archive.addFile(manifestName, Buffer.from('<manifest></manifest>'));

				const file = archive.toBuffer();

				return { file };
			};

			it('should use imsmanifest.xml as manifest', () => {
				const { file } = setup('imsmanifest.xml');
				const parser = new CommonCartridgeFileParser(file);

				expect(parser.manifest).toBeDefined();
			});

			it('should use manifest.xml as manifest', () => {
				const { file } = setup('manifest.xml');
				const parser = new CommonCartridgeFileParser(file);

				expect(parser.manifest).toBeDefined();
			});
		});

		describe('when manifest file is not found', () => {
			const setup = () => {
				const archive = new AdmZip();
				const file = archive.toBuffer();

				return { file };
			};

			it('should throw', () => {
				const { file } = setup();

				expect(() => new CommonCartridgeFileParser(file)).toThrow('Manifest file not found');
			});
		});
	});
});
