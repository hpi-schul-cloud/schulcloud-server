import { fileFolderElementFactory } from '../testing';
import { FileFolderElement, isFileFolderElement } from './file-folder-element.do';

describe('FileFolderElement', () => {
	let folderElement: FileFolderElement;

	beforeEach(() => {
		folderElement = fileFolderElementFactory.build({
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
