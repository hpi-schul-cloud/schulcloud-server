import { FileDo } from './file';

describe('FileDo', () => {
	it('should sanitize file names correctly', () => {
		const file = new FileDo({
			id: 'file123',
			name: './../some/unsafe\\path\\file.txt  ',
			isDirectory: false,
		});

		expect(file.sanitizedName).toBe('._.._some_unsafe_path_file.txt');
	});

	it('should handle empty and pure traversal names', () => {
		const file1 = new FileDo({
			id: 'file123',
			name: '   ',
			isDirectory: false,
		});

		const file2 = new FileDo({
			id: 'file124',
			name: '.',
			isDirectory: false,
		});

		const file3 = new FileDo({
			id: 'file125',
			name: '..',
			isDirectory: false,
		});

		expect(file1.sanitizedName).toBe('_');
		expect(file2.sanitizedName).toBe('_');
		expect(file3.sanitizedName).toBe('_');
	});
});
