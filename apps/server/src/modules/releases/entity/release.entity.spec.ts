import { ObjectId } from '@mikro-orm/mongodb';
import { ReleaseEntity, type ReleaseEntityProps } from './release.entity';

describe(ReleaseEntity.name, () => {
	const buildProps = (overrides: Partial<ReleaseEntityProps> = {}): ReleaseEntityProps => {
		return {
			name: 'Release 1',
			url: 'https://example.com/releases/1',
			author: 'JohnDoe',
			authorUrl: 'https://example.com/JohnDoe',
			publishedAt: new Date('2024-01-02T00:00:00Z'),
			...overrides,
		};
	};

	describe('constructor', () => {
		describe('when all props are given', () => {
			it('should set all properties', () => {
				const id = new ObjectId().toHexString();
				const createdAt = new Date('2024-01-01T00:00:00Z');
				const props = buildProps({ id, body: 'body', createdAt, zipUrl: 'https://example.com/zip' });

				const entity = new ReleaseEntity(props);

				expect(entity).toEqual(
					expect.objectContaining({
						id,
						name: props.name,
						body: 'body',
						url: props.url,
						author: props.author,
						authorUrl: props.authorUrl,
						createdAt,
						publishedAt: props.publishedAt,
						zipUrl: 'https://example.com/zip',
					})
				);
			});
		});

		describe('when optional props are missing', () => {
			it('should use defaults', () => {
				const entity = new ReleaseEntity(buildProps());

				expect(entity.id).toBeUndefined();
				expect(entity.body).toBe('');
				expect(entity.createdAt).toBeInstanceOf(Date);
				expect(entity.zipUrl).toBeUndefined();
			});
		});
	});
});
