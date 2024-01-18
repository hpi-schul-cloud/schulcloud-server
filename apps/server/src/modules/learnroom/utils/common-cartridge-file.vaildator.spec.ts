import AdmZip from 'adm-zip';
import { CommonCartridgeFileValidator } from './common-cartridge-file.validator';

describe('CommonCartridgeFileValidator', () => {
	describe('isValid', () => {
		describe('when file is a valid Common Cartridge file', () => {
			const setup = (manifest: string) => {
				const sut = new CommonCartridgeFileValidator();
				const archive = new AdmZip();

				archive.addFile(manifest, Buffer.from(''));

				return { sut, file: { buffer: archive.toBuffer() } };
			};

			it('should return true with imsmanifest.xml', () => {
				const { sut, file } = setup('imsmanifest.xml');

				const result = sut.isValid(file);

				expect(result).toBe(true);
			});

			it('should return true with manifest.xml', () => {
				const { sut, file } = setup('manifest.xml');

				const result = sut.isValid(file);

				expect(result).toBe(true);
			});
		});

		describe('when file is NOT containing a manifest', () => {
			const setup = () => {
				const sut = new CommonCartridgeFileValidator();
				const archive = new AdmZip();

				return { sut, file: { buffer: archive.toBuffer() } };
			};

			it('should return false', () => {
				const { sut, file } = setup();

				const result = sut.isValid(file);

				expect(result).toBe(false);
			});
		});

		describe('when file is NOT ZIP compressed', () => {
			const setup = () => {
				const sut = new CommonCartridgeFileValidator();

				return { sut, file: { buffer: Buffer.from('') } };
			};

			it('should return false', () => {
				const { sut, file } = setup();

				const result = sut.isValid(file);

				expect(result).toBe(false);
			});
		});
	});

	describe('buildErrorMessage', () => {
		describe('when file is not a valid Common Cartridge file', () => {
			const setup = () => {
				const sut = new CommonCartridgeFileValidator();

				return { sut };
			};

			it('should return error message', () => {
				const { sut } = setup();

				const result = sut.buildErrorMessage();

				expect(result).toBe('The file is not a valid Common Cartridge file.');
			});
		});
	});
});
