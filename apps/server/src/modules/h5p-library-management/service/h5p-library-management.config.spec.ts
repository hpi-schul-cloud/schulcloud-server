import { h5PLibraryManagementConfig } from './h5p-library-management.config';

describe('H5PLibraryManagementConfig', () => {
	describe('h5PLibraryManagementConfig', () => {
		describe('when h5PLibraryManagementConfig is called', () => {
			it('should get Object s3ConfigLibraries', () => {
				const config = h5PLibraryManagementConfig();
				expect(config).toBeDefined();
			});
		});
	});
});
