import { IContentMetadata } from '@lumieducation/h5p-server/build/src/types';
import { H5PContentMetadata } from './h5p-editor.response';

describe('H5PContentMetadata', () => {
	let h5pContentMetadata: H5PContentMetadata;

	beforeEach(() => {
		const testContentMetadata: IContentMetadata = {
			embedTypes: ['iframe'],
			language: 'en',
			mainLibrary: 'testLibrary',
			preloadedDependencies: [
				{ machineName: 'Dependency1', majorVersion: 1, minorVersion: 0 },
				{ machineName: 'Dependency2', majorVersion: 2, minorVersion: 0 },
			],
			defaultLanguage: '',
			license: '',
			title: '',
		};
		h5pContentMetadata = new H5PContentMetadata(testContentMetadata);
	});

	it('should be defined', () => {
		expect(h5pContentMetadata).toBeDefined();
	});
});
