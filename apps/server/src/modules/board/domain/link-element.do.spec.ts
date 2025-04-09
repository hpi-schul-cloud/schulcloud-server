import { linkElementFactory } from '../testing';
import { LinkElement, isLinkElement } from './link-element.do';

describe('LinkElement', () => {
	let linkElement: LinkElement;

	beforeEach(() => {
		linkElement = linkElementFactory.build({
			url: 'https://example.com',
			title: 'Example',
			description: 'Example description',
			imageUrl: 'https://example.com/image.jpg',
			originalImageUrl: 'https://example.com/image.jpg',
		});
	});

	it('should be instance of LinkElement', () => {
		expect(isLinkElement(linkElement)).toBe(true);
	});

	it('should not be instance of LinkElement', () => {
		expect(isLinkElement({})).toBe(false);
	});

	it('should return url', () => {
		expect(linkElement.url).toBe('https://example.com');
	});

	it('should set url', () => {
		linkElement.url = 'https://newurl.com';
		expect(linkElement.url).toBe('https://newurl.com');
	});

	it('should return title', () => {
		expect(linkElement.title).toBe('Example');
	});

	it('should set title', () => {
		linkElement.title = 'New title';
		expect(linkElement.title).toBe('New title');
	});

	it('should return description', () => {
		expect(linkElement.description).toBe('Example description');
	});

	it('should set description', () => {
		linkElement.description = 'New description';
		expect(linkElement.description).toBe('New description');
	});

	it('should return imageUrl', () => {
		expect(linkElement.imageUrl).toBe('https://example.com/image.jpg');
	});

	it('should set imageUrl', () => {
		linkElement.imageUrl = 'https://newurl.com/newimage.jpg';
		expect(linkElement.imageUrl).toBe('https://newurl.com/newimage.jpg');
	});

	it('should return originalImageUrl', () => {
		expect(linkElement.originalImageUrl).toBe('https://example.com/image.jpg');
	});

	it('should set originalImageUrl', () => {
		linkElement.originalImageUrl = 'https://newurl.com/newimage.jpg';
		expect(linkElement.originalImageUrl).toBe('https://newurl.com/newimage.jpg');
	});

	it('should not have child', () => {
		expect(linkElement.canHaveChild()).toBe(false);
	});
});
