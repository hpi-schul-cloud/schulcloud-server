import { LinkElement, isLinkElement } from './link-element.do';
import { BoardNodeProps } from './types/board-node-props';

describe('LinkElement', () => {
	let linkElement: LinkElement;

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
		linkElement = new LinkElement({
			...boardNodeProps,
			url: 'https://example.com',
			title: 'Example',
			description: 'Example description',
			imageUrl: 'https://example.com/image.jpg',
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

	it('should not have child', () => {
		expect(linkElement.canHaveChild()).toBe(false);
	});
});
