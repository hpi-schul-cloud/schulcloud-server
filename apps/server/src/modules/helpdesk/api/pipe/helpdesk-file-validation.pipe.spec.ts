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
				const files = undefined;
				// @ts-expect-error Testing undefined value
				const result = pipe.transform(files);

				expect(result).toEqual(files);
			});

			it('should return the value when file array is empty', () => {
				const files = [];

				const result = pipe.transform(files);

				expect(result).toEqual(files);
			});
		});

		describe('when a valid PDF file is provided', () => {
			it('should return the value without errors', () => {
				const files = [
					{
						mimetype: 'application/pdf',
						size: 1000,
					} as Express.Multer.File,
				];

				const result = pipe.transform(files);
				expect(result).toEqual(files);
			});
		});

		describe('when a valid image file is provided', () => {
			it('should return the value without errors for JPEG', () => {
				const files = [
					{
						mimetype: 'image/jpeg',
						size: 1000,
					} as Express.Multer.File,
				];

				const result = pipe.transform(files);

				expect(result).toEqual(files);
			});

			it('should return the value without errors for PNG', () => {
				const files = [
					{
						mimetype: 'image/png',
						size: 1000,
					} as Express.Multer.File,
				];

				const result = pipe.transform(files);

				expect(result).toEqual(files);
			});
		});

		describe('when a valid DOCX file is provided', () => {
			it('should return the value without errors', () => {
				const files = [
					{
						mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
						size: 1000,
					} as Express.Multer.File,
				];

				const result = pipe.transform(files);
				expect(result).toEqual(files);
			});
		});

		describe('when a valid MP4 file is provided', () => {
			it('should return the value without errors', () => {
				const files = [
					{
						mimetype: 'video/mp4',
						size: 1000,
					} as Express.Multer.File,
				];
				const result = pipe.transform(files);

				expect(result).toEqual(files);
			});
		});

		describe('when an invalid file type is provided', () => {
			it('should throw a BadRequestException', () => {
				const files = [
					{
						mimetype: 'application/zip',
						size: 1000,
					} as Express.Multer.File,
				];

				expect(() => pipe.transform(files)).toThrow(BadRequestException);
			});
		});

		describe('when file size exceeds the limit', () => {
			it('should throw a BadRequestException', () => {
				const files = [
					{
						mimetype: 'application/pdf',
						size: 5000 * 1024 + 1, // Exceeds 5 MB limit
					} as Express.Multer.File,
				];

				expect(() => pipe.transform(files)).toThrow(BadRequestException);
			});
		});

		describe('when multiple files are provided', () => {
			it('should validate all files', () => {
				const files = [
					{
						mimetype: 'application/pdf',
						size: 1000,
					} as Express.Multer.File,
					{
						mimetype: 'image/jpeg',
						size: 2000,
					} as Express.Multer.File,
				];

				const result = pipe.transform(files);

				expect(result).toEqual(files);
			});

			it('should throw if any file is invalid', () => {
				const files = [
					{
						mimetype: 'application/pdf',
						size: 1000,
					} as Express.Multer.File,
					{
						mimetype: 'application/zip',
						size: 2000,
					} as Express.Multer.File,
				];

				expect(() => pipe.transform(files)).toThrow(BadRequestException);
			});

			it('should throw if total size of all files exceeds the limit', () => {
				const files = [
					{
						mimetype: 'application/pdf',
						size: 3000 * 1024,
					} as Express.Multer.File,
					{
						mimetype: 'image/jpeg',
						size: 2001 * 1024, // Total: 5001 KB > 5000 KB limit
					} as Express.Multer.File,
				];

				expect(() => pipe.transform(files)).toThrow(BadRequestException);
			});
		});
	});
});
