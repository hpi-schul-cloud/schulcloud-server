import { LessonResources } from './lesson-resources.model';

describe('LessonResources', () => {
	describe('should test LessonResources Constructor', () => {
		it('should create an instance with all properties', () => {
			const client = 'client1';
			const description = 'description1';
			const title = 'title1';
			const url = 'http://example.com';
			const merlinReference = 'merlin1';

			const lessonResources = new LessonResources(client, description, title, url, merlinReference);

			expect(lessonResources.client).toBe(client);
			expect(lessonResources.description).toBe(description);
			expect(lessonResources.title).toBe(title);
			expect(lessonResources.url).toBe(url);
			expect(lessonResources.merlinReference).toBe(merlinReference);
		});
	});

	describe('should test LessonResources Edge Cases', () => {
		it('should create an instance without merlinReference', () => {
			const client = 'client2';
			const description = 'description2';
			const title = 'title2';
			const url = 'http://example2.com';

			const lessonResources = new LessonResources(client, description, title, url);

			expect(lessonResources.client).toBe(client);
			expect(lessonResources.description).toBe(description);
			expect(lessonResources.title).toBe(title);
			expect(lessonResources.url).toBe(url);
			expect(lessonResources.merlinReference).toBeUndefined();
		});
		it('should create an instance without url', () => {
			const client = 'client2';
			const description = 'description2';
			const title = 'title2';
			const merlinReference = 'http://example2.com';

			const lessonResources = new LessonResources(client, description, title, undefined, merlinReference);

			expect(lessonResources.client).toBe(client);
			expect(lessonResources.description).toBe(description);
			expect(lessonResources.title).toBe(title);
			expect(lessonResources.merlinReference).toBe(merlinReference);
			expect(lessonResources.url).toBeUndefined();
		});
	});
});
