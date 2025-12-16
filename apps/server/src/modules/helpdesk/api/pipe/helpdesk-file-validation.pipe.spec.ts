import { BadRequestException } from '@nestjs/common';
import { HelpdeskFileValidationPipe } from './helpdesk-file-validation.pipe';

describe('HelpdeskFileValidationPipe', () => {
	let pipe: HelpdeskFileValidationPipe;

	beforeEach(() => {
		pipe = new HelpdeskFileValidationPipe();
	});

	describe('transform', () => {
		describe('when no files are provided', () => {
			it('should return the value without errors', () => {
				const value = { file: undefined };

				const result = pipe.transform(value);

				expect(result).toEqual(value);
			});

			it('should return the value when file array is empty', () => {
				const value = { file: [] };

				const result = pipe.transform(value);

				expect(result).toEqual(value);
			});
		});

		describe('when a valid PDF file is provided', () => {
			it('should return the value without errors', () => {
				const value = {
					file: [
						{
							mimetype: 'application/pdf',
							size: 1000,
						} as Express.Multer.File,
					],
				};

				const result = pipe.transform(value);

				expect(result).toEqual(value);
			});
		});

		describe('when a valid image file is provided', () => {
			it('should return the value without errors for JPEG', () => {
				const value = {
					file: [
						{
							mimetype: 'image/jpeg',
							size: 1000,
						} as Express.Multer.File,
					],
				};

				const result = pipe.transform(value);

				expect(result).toEqual(value);
			});

			it('should return the value without errors for PNG', () => {
				const value = {
					file: [
						{
							mimetype: 'image/png',
							size: 1000,
						} as Express.Multer.File,
					],
				};

				const result = pipe.transform(value);

				expect(result).toEqual(value);
			});
		});

		describe('when a valid DOCX file is provided', () => {
			it('should return the value without errors', () => {
				const value = {
					file: [
						{
							mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
							size: 1000,
						} as Express.Multer.File,
					],
				};

				const result = pipe.transform(value);

				expect(result).toEqual(value);
			});
		});

		describe('when a valid MP4 file is provided', () => {
			it('should return the value without errors', () => {
				const value = {
					file: [
						{
							mimetype: 'video/mp4',
							size: 1000,
						} as Express.Multer.File,
					],
				};

				const result = pipe.transform(value);

				expect(result).toEqual(value);
			});
		});

		describe('when an invalid file type is provided', () => {
			it('should throw a BadRequestException', () => {
				const value = {
					file: [
						{
							mimetype: 'application/zip',
							size: 1000,
						} as Express.Multer.File,
					],
				};

				expect(() => pipe.transform(value)).toThrow(BadRequestException);
			});
		});

		describe('when file size exceeds the limit', () => {
			it('should throw a BadRequestException', () => {
				const value = {
					file: [
						{
							mimetype: 'application/pdf',
							size: 5000 * 1024 + 1, // Exceeds 5 MB limit
						} as Express.Multer.File,
					],
				};

				expect(() => pipe.transform(value)).toThrow(BadRequestException);
			});
		});

		describe('when multiple files are provided', () => {
			it('should validate all files', () => {
				const value = {
					file: [
						{
							mimetype: 'application/pdf',
							size: 1000,
						} as Express.Multer.File,
						{
							mimetype: 'image/jpeg',
							size: 2000,
						} as Express.Multer.File,
					],
				};

				const result = pipe.transform(value);

				expect(result).toEqual(value);
			});

			it('should throw if any file is invalid', () => {
				const value = {
					file: [
						{
							mimetype: 'application/pdf',
							size: 1000,
						} as Express.Multer.File,
						{
							mimetype: 'application/zip',
							size: 2000,
						} as Express.Multer.File,
					],
				};

				expect(() => pipe.transform(value)).toThrow(BadRequestException);
			});

			it('should throw if total size of all files exceeds the limit', () => {
				const value = {
					file: [
						{
							mimetype: 'application/pdf',
							size: 3000 * 1024,
						} as Express.Multer.File,
						{
							mimetype: 'image/jpeg',
							size: 2001 * 1024, // Total: 5001 KB > 5000 KB limit
						} as Express.Multer.File,
					],
				};

				expect(() => pipe.transform(value)).toThrow(BadRequestException);
			});
		});
	});
});
