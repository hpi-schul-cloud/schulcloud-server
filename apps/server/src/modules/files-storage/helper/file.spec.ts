import { createMock } from '@golevelup/ts-jest';
import { fileRecordFactory } from '@shared/testing';
import { FileInfo } from 'busboy';
import { Request } from 'express';
import { IFile } from '../interface';
import { createFile } from './file';

describe('File Helper', () => {
	describe('createFile is called', () => {
		const setup = () => {
			const fileRecord = fileRecordFactory.build();

			const fileInfo: FileInfo = {
				filename: fileRecord.name,
				encoding: '7-bit',
				mimeType: fileRecord.mimeType,
			};

			const size = 10699;
			const request = createMock<Request>({
				get: () => {
					return `${size}`;
				},
			});

			const buffer = Buffer.from('abc');

			const expectedFile: IFile = {
				name: fileRecord.name,
				buffer,
				size,
				mimeType: fileRecord.mimeType,
			};

			return { fileInfo, request, buffer, expectedFile };
		};

		it('should return file', () => {
			const { fileInfo, request, buffer, expectedFile } = setup();

			const result = createFile(fileInfo, request, buffer);

			expect(result).toEqual(expectedFile);
		});
	});
});
