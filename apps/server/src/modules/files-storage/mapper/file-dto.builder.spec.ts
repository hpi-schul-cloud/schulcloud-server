import { createMock } from '@golevelup/ts-jest';
import { fileRecordFactory } from '@shared/testing';
import { AxiosResponse } from 'axios';
import { Request } from 'express';
import { Readable } from 'stream';
import { FileDto } from '../dto';
import { FileDtoBuilder } from './file-dto.builder';

describe('File Builder', () => {
	describe('buildFromRequest is called', () => {
		const setup = () => {
			const fileRecord = fileRecordFactory.build();

			const size = 10699;
			const request = createMock<Request>({
				get: () => {
					return `${size}`;
				},
			});

			const buffer = Buffer.from('abc');

			const expectedFile = new FileDto({
				name: fileRecord.name,
				buffer,
				size,
				mimeType: fileRecord.mimeType,
			});

			const fileInfo = {
				filename: fileRecord.name,
				encoding: '7-bit',
				mimeType: fileRecord.mimeType,
			};

			return { fileRecord, request, buffer, expectedFile, fileInfo };
		};

		it('should return file from request', () => {
			const { fileInfo, request, buffer, expectedFile } = setup();

			const result = FileDtoBuilder.buildFromRequest(fileInfo, request, buffer);

			expect(result).toEqual(expectedFile);
		});
	});

	describe('buildFromAxiosResponse is called', () => {
		const setup = () => {
			const fileRecord = fileRecordFactory.build();
			const readable = Readable.from('abc');

			const size = 10699;
			const response = createMock<AxiosResponse<Readable>>({
				data: readable,
				headers: { 'content-length': `${size}`, 'content-type': fileRecord.mimeType },
			});

			const expectedFile = new FileDto({
				name: fileRecord.name,
				buffer: readable,
				size,
				mimeType: fileRecord.mimeType,
			});

			return { fileRecord, response, expectedFile };
		};

		it('should return file from request', () => {
			const { response, expectedFile, fileRecord } = setup();

			const result = FileDtoBuilder.buildFromAxiosResponse(fileRecord.name, response);

			expect(result).toEqual(expectedFile);
		});
	});
});
