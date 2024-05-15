import { createMock } from '@golevelup/ts-jest';
import { fileRecordFactory } from '@shared/testing/factory';
import { AxiosResponse } from 'axios';
import { Readable } from 'stream';
import { FileDto } from '../dto';
import { FileDtoBuilder } from './file-dto.builder';

describe('File Builder', () => {
	describe('buildFromRequest is called', () => {
		const setup = () => {
			const fileRecord = fileRecordFactory.build();

			const readable = Readable.from('abc');

			const expectedFile = new FileDto({
				name: fileRecord.name,
				data: readable,
				mimeType: fileRecord.mimeType,
			});

			const fileInfo = {
				filename: fileRecord.name,
				encoding: '7-bit',
				mimeType: fileRecord.mimeType,
			};

			return { fileRecord, readable, expectedFile, fileInfo };
		};

		it('should return file from request', () => {
			const { fileInfo, readable, expectedFile } = setup();

			const result = FileDtoBuilder.buildFromRequest(fileInfo, readable);

			expect(result).toEqual(expectedFile);
		});
	});

	describe('buildFromAxiosResponse is called', () => {
		const setup = () => {
			const fileRecord = fileRecordFactory.build();
			const readable = Readable.from('abc');

			const response = createMock<AxiosResponse<Readable>>({
				data: readable,
				headers: { 'content-type': fileRecord.mimeType },
			});

			const expectedFile = new FileDto({
				name: fileRecord.name,
				data: readable,
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
