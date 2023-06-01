import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { H5PEditorService, H5PPlayerService } from '../service';
import { H5PEditorUc } from './h5p.uc';

describe('H5P Ajax', () => {
	let module: TestingModule;
	let uc: H5PEditorUc;
	let editorService: H5PEditorService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				H5PEditorUc,
				H5PEditorService,
				H5PPlayerService,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		uc = module.get(H5PEditorUc);
		editorService = module.get(H5PEditorService);
		await setupEntities();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('when getting content type', () => {
		it('should call H5PEditor.getContentTypeCache and return the result', async () => {
			const dummyResponse = {
				apiVersion: { major: 1, minor: 1 },
				details: [],
				libraries: [],
				outdated: false,
				recentlyUsed: [],
				user: 'DummyUser',
			};

			const editorSpy = jest.spyOn(editorService.h5pEditor, 'getContentTypeCache');
			editorSpy.mockResolvedValueOnce(dummyResponse);

			const result = await uc.getAjax({ action: 'content-type-cache', language: 'de' });

			expect(result).toBe(dummyResponse);
			// Todo: user
			expect(editorSpy).toHaveBeenCalledWith(expect.anything(), 'de');
		});
	});

	describe('when getting library data', () => {
		it('should call H5PEditor.getLibraryData and return the result', async () => {
			const dummyLibrary = {
				css: [],
				defaultLanguage: 'de',
				javascript: [],
				language: 'de',
				languages: ['de', 'en'],
				name: 'DummyLibrary',
				semantics: [],
				title: 'Dummy Library',
				upgradesScript: '',
				translations: [],
				version: {
					major: 1,
					minor: 1,
				},
			};

			const editorSpy = jest.spyOn(editorService.h5pEditor, 'getLibraryData');
			editorSpy.mockResolvedValueOnce(dummyLibrary);

			const result = await uc.getAjax({
				action: 'libraries',
				machineName: 'DummyLibrary',
				majorVersion: '1',
				minorVersion: '1',
			});

			expect(result).toEqual(dummyLibrary);
			expect(editorSpy).toHaveBeenCalledWith('DummyLibrary', '1', '1', undefined);
		});

		it('should fail if parameters are not set', async () => {
			const editorSpy = jest.spyOn(editorService.h5pEditor, 'getLibraryData');

			const testCases = [
				{
					action: 'libraries',
					majorVersion: '1',
					minorVersion: '1',
				},
				{
					action: 'libraries',
					machineName: 'DummyLibrary',
					minorVersion: '1',
				},
				{
					action: 'libraries',
					machineName: 'DummyLibrary',
					majorVersion: '1',
				},
			];

			await Promise.all(testCases.map((testCase) => expect(uc.getAjax(testCase)).rejects.toThrow('malformed-request')));

			expect(editorSpy).toHaveBeenCalledTimes(0);
		});
	});

	describe('when requesting unknown actions', () => {
		it('should throw error', async () => {
			const result = uc.getAjax({ action: 'invalid-action' });
			await expect(result).rejects.toThrow('malformed-request');
		});
	});
});
