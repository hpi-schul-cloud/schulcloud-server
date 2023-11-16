import fs from 'fs';
import { ReferencesService } from './references.service';

describe(ReferencesService.name, () => {
	describe(ReferencesService.loadFromTxtFile.name, () => {
		const setup = (mockedFileContent: string) => {
			jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(mockedFileContent);
		};

		describe('when passed a completely empty file (without any content)', () => {
			it('should return an empty references array', () => {
				setup('');

				const references = ReferencesService.loadFromTxtFile('references.txt');

				expect(references).toEqual([]);
			});
		});

		describe('when passed a file without any references (just some empty lines)', () => {
			it('should return an empty references array', () => {
				setup('\n\n \n    \n\n\n    \n\n\n');

				const references = ReferencesService.loadFromTxtFile('references.txt');

				expect(references).toEqual([]);
			});
		});

		describe('when passed a file with 3 references on a few separate lines', () => {
			describe('split with CRs', () => {
				it('should return an array with all the references present in a file', () => {
					setup('653fd3b784ca851b17e98579\r653fd3b784ca851b17e9857a\r653fd3b784ca851b17e9857b\n\n\n');

					const references = ReferencesService.loadFromTxtFile('references.txt');

					expect(references).toEqual([
						'653fd3b784ca851b17e98579',
						'653fd3b784ca851b17e9857a',
						'653fd3b784ca851b17e9857b',
					]);
				});
			});

			describe('split with LFs', () => {
				it('should return an array with all the references present in a file', () => {
					setup('653fd3b784ca851b17e98579\n653fd3b784ca851b17e9857a\n653fd3b784ca851b17e9857b\n\n\n');

					const references = ReferencesService.loadFromTxtFile('references.txt');

					expect(references).toEqual([
						'653fd3b784ca851b17e98579',
						'653fd3b784ca851b17e9857a',
						'653fd3b784ca851b17e9857b',
					]);
				});
			});

			describe('split with CRLFs', () => {
				it('should return an array with all the references present in a file', () => {
					setup('653fd3b784ca851b17e98579\r\n653fd3b784ca851b17e9857a\r\n653fd3b784ca851b17e9857b\r\n\r\n\r\n');

					const references = ReferencesService.loadFromTxtFile('references.txt');

					expect(references).toEqual([
						'653fd3b784ca851b17e98579',
						'653fd3b784ca851b17e9857a',
						'653fd3b784ca851b17e9857b',
					]);
				});
			});
		});
	});
});
