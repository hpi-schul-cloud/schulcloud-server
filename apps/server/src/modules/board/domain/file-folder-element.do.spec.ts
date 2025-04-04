import { FileFolderElement, isFileFolderElement } from './file-folder-element.do';
import { BoardNodeProps } from './types';

describe('FileFolderElement', () => {
	let folderElement: FileFolderElement;

	const boardNodeProps: BoardNodeProps = {
		id: '1',
		path: '',
		level: 1,
		position: 1,
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	beforeEach(() => {
		folderElement = new FileFolderElement({
			...boardNodeProps,
			title: 'Test title',
		});
	});

	it('should be instance of FileElement', () => {
		expect(isFileFolderElement(folderElement)).toBe(true);
	});

	it('should not be instance of FileElement', () => {
		expect(isFileFolderElement({})).toBe(false);
	});

	it('should return title', () => {
		expect(folderElement.title).toBe('Test title');
	});

	it('should set title', () => {
		folderElement.title = 'New title';
		expect(folderElement.title).toBe('New title');
	});

	it('should not have child', () => {
		expect(folderElement.canHaveChild()).toBe(false);
	});
});
