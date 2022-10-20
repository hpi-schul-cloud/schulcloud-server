import { createMock } from '@golevelup/ts-jest';
import { fileRecordFactory } from '@shared/testing';
import { AxiosResponse } from 'axios';
import { Request } from 'express';
import { IFile } from '../interface';
import { createFile } from './file';

describe('File Helper', () => {
	describe('createFile is called', () => {
		const setup = () => {
			const fileRecord = fileRecordFactory.build();

			const size = 10699;
			const request = createMock<Request>({
				headers: {
					'content-length': `${size}`,
					'content-type': fileRecord.mimeType,
				},
			});

			const response = createMock<AxiosResponse>({
				headers: {
					'content-length': `${size}`,
					'content-type': fileRecord.mimeType,
				},
			});

			const buffer = Buffer.from('abc');

			const expectedFile: IFile = {
				name: fileRecord.name,
				buffer,
				size,
				mimeType: fileRecord.mimeType,
			};

			return { fileRecord, request, response, buffer, expectedFile };
		};

		it('should return file from request', () => {
			const { fileRecord, request, buffer, expectedFile } = setup();

			const result = createFile(fileRecord.name, request, buffer);

			expect(result).toEqual(expectedFile);
		});

		it('should return file from response', () => {
			const { fileRecord, response, buffer, expectedFile } = setup();

			const result = createFile(fileRecord.name, response, buffer);

			expect(result).toEqual(expectedFile);
		});
	});
});
