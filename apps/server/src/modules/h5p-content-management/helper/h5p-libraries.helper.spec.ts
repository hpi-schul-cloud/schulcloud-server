import { InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import { getLibraryWhiteList, resetLibraryWhiteList } from './h5p-libraries.helper';

jest.mock('fs', (): unknown => {
	return {
		...jest.requireActual('fs'),
		readFileSync: jest.fn(),
	};
});

describe('getLibraryWhiteList', () => {
	afterEach(() => {
		jest.resetAllMocks();
		resetLibraryWhiteList();
	});

	describe('when filePath does exist', () => {
		describe('when file contains valid YAML content', () => {
			const setup = () => {
				const filePath = 'config/h5p-libraries.yaml';
				const validYamlContent = 'h5p_libraries:\r\n  - H5P.Accordion\r\n';

				const readFileSyncSpy = jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(validYamlContent);

				return { filePath, readFileSyncSpy };
			};

			it('should return correct white list', () => {
				const { filePath, readFileSyncSpy } = setup();

				const libraryWhiteList = getLibraryWhiteList(filePath);

				expect(readFileSyncSpy).toHaveBeenCalledWith(filePath, { encoding: 'utf-8' });
				expect(libraryWhiteList).toEqual(['H5P.Accordion']);
			});
		});

		describe('when file contains invalid YAML content', () => {
			const setup = () => {
				const filePath = 'config/h5p-libraries.yaml';
				const invalidYamlContent = 'No valid YAML content';

				const readFileSyncSpy = jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(invalidYamlContent);

				return { filePath, readFileSyncSpy };
			};

			it('should throw InternalServerErrorException', () => {
				const { filePath, readFileSyncSpy } = setup();

				expect(() => getLibraryWhiteList(filePath)).toThrow(InternalServerErrorException);
				expect(readFileSyncSpy).toHaveBeenCalledWith(filePath, { encoding: 'utf-8' });
			});
		});
	});

	describe('when filePath does not exist', () => {
		const setup = () => {
			const filePath = 'config/h5p-libraries.yaml';

			const error = new Error('File not found');
			const readFileSyncSpy = jest.spyOn(fs, 'readFileSync').mockImplementationOnce(() => {
				throw error;
			});

			return { filePath, readFileSyncSpy };
		};

		it('should throw an error', () => {
			const { filePath, readFileSyncSpy } = setup();

			expect(() => getLibraryWhiteList(filePath)).toThrowError('File not found');
			expect(readFileSyncSpy).toHaveBeenCalledWith(filePath, { encoding: 'utf-8' });
		});
	});

	describe('singleton functionality', () => {
		describe('when getLibraryWhiteList is called multiple times', () => {
			const setup = () => {
				const filePath = 'config/h5p-libraries.yaml';
				const validYamlContent = 'h5p_libraries:\r\n  - H5P.Accordion\r\n  - H5P.InteractiveVideo\r\n';

				const readFileSyncSpy = jest.spyOn(fs, 'readFileSync').mockReturnValue(validYamlContent);

				return { filePath, readFileSyncSpy };
			};

			it('should only read the file once and cache the result', () => {
				const { filePath, readFileSyncSpy } = setup();

				const firstResult = getLibraryWhiteList(filePath);
				const secondResult = getLibraryWhiteList(filePath);
				const thirdResult = getLibraryWhiteList(filePath);

				expect(readFileSyncSpy).toHaveBeenCalledTimes(1);
				expect(readFileSyncSpy).toHaveBeenCalledWith(filePath, { encoding: 'utf-8' });

				expect(firstResult).toEqual(['H5P.Accordion', 'H5P.InteractiveVideo']);
				expect(secondResult).toEqual(['H5P.Accordion', 'H5P.InteractiveVideo']);
				expect(thirdResult).toEqual(['H5P.Accordion', 'H5P.InteractiveVideo']);

				expect(firstResult).toBe(secondResult); // Should be the same reference
				expect(secondResult).toBe(thirdResult); // Should be the same reference
			});
		});

		describe('when getLibraryWhiteList is called with different file paths', () => {
			const setup = () => {
				const filePath1 = 'config/h5p-libraries.yaml';
				const filePath2 = 'config/different-h5p-libraries.yaml';
				const validYamlContent = 'h5p_libraries:\r\n  - H5P.Accordion\r\n';

				const readFileSyncSpy = jest.spyOn(fs, 'readFileSync').mockReturnValue(validYamlContent);

				return { filePath1, filePath2, readFileSyncSpy };
			};

			it('should still only read once and ignore subsequent different file paths', () => {
				const { filePath1, filePath2, readFileSyncSpy } = setup();

				const firstResult = getLibraryWhiteList(filePath1);
				const secondResult = getLibraryWhiteList(filePath2); // Different path, but should still use cached value

				expect(readFileSyncSpy).toHaveBeenCalledTimes(1);
				expect(readFileSyncSpy).toHaveBeenCalledWith(filePath1, { encoding: 'utf-8' });
				expect(readFileSyncSpy).not.toHaveBeenCalledWith(filePath2, { encoding: 'utf-8' });

				expect(firstResult).toEqual(['H5P.Accordion']);
				expect(secondResult).toEqual(['H5P.Accordion']);
				expect(firstResult).toBe(secondResult); // Should be the same cached reference
			});
		});
	});
});
