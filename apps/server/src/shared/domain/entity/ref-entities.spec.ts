import { Collection, Entity, IdentifiedReference, ManyToOne, OneToMany, Property, Reference } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { BaseEntityWithTimestamps } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';

@Entity()
class Author extends BaseEntityWithTimestamps {
	@Property()
	firstName: string;

	@Property()
	lastName: string;

	@Property()
	email: string;

	@OneToMany('Book', '_author', { fieldName: 'author' })
	_books = new Collection<Book>(this);

	get books(): Book[] {
		const items = this._books.getItems();
		return items;
	}

	getBookTitles(): string[] {
		const titles = this.books.map((b) => b.title);
		return titles;
	}

	constructor(props: { firstName: string; lastName: string; email: string }) {
		super();
		this.firstName = props.firstName;
		this.lastName = props.lastName;
		this.email = props.email;
	}
}

@Entity()
class Book extends BaseEntityWithTimestamps {
	@Property()
	title: string;

	@ManyToOne(() => Author, { wrappedReference: true, fieldName: 'author' })
	_author: IdentifiedReference<Author>;

	get author(): Author {
		const entity = this._author.getEntity();
		return entity;
	}

	getAuthorFullName(): string {
		const fullName = `${this.author.firstName} ${this.author.lastName}`;
		return fullName;
	}

	constructor(props: { title: string; author: Author }) {
		super();
		this.title = props.title;
		this._author = Reference.create(props.author);
	}
}

describe('relations', () => {
	let module: TestingModule;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [Author, Book] })],
		}).compile();

		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await em.nativeDelete(Author, {});
		await em.nativeDelete(Book, {});
	});

	describe('the author', () => {
		let author: Author;
		let books: Book[];

		beforeEach(async () => {
			author = new Author({ firstName: 'John', lastName: 'Doe', email: 'john@example.com' });
			books = [new Book({ title: 'A Better World', author }), new Book({ title: 'A Much Better World', author })];
			await em.persistAndFlush(author);
			em.clear();
		});

		it('should persist the author', async () => {
			const result = await em.findOneOrFail(Author, { id: author.id });
			expect(result).toBeDefined();
		});

		describe('getting the books', () => {
			it('should have an uninitialized books collection', async () => {
				const result = await em.findOneOrFail(Author, { id: author.id });
				expect(result._books.isInitialized()).toBe(false);

				await result._books.loadItems();
				expect(result._books.isInitialized()).toBe(true);
			});

			it('should throw an error if the books collection was not loaded', async () => {
				const result = await em.findOneOrFail(Author, { id: author.id });
				expect(() => result.books).toThrow();
			});
		});

		describe('getting the book titles', () => {
			it('should provide the book titles if books are loaded', async () => {
				const result = await em.findOneOrFail(Author, { id: author.id }, { populate: ['_books'] });
				const titles = books.map((b) => b.title).sort();
				expect(result.getBookTitles().sort()).toEqual(titles);
			});

			it('should throw an error if the books collection was not loaded', async () => {
				const result = await em.findOneOrFail(Author, { id: author.id });
				expect(() => result.getBookTitles()).toThrow();
			});
		});
	});

	describe('the book', () => {
		let book: Book;
		let author: Author;

		beforeEach(async () => {
			author = new Author({ firstName: 'John', lastName: 'Doe', email: 'john@example.com' });
			book = new Book({ title: 'A Better World', author });
			await em.persistAndFlush(book);
			em.clear();
		});

		it('should persist the book', async () => {
			const result = await em.findOneOrFail(Book, { id: book.id });
			expect(result).toBeDefined();
		});

		describe('getting the author', () => {
			it('should have an uninitialized author reference', async () => {
				const result = await em.findOneOrFail(Book, { id: book.id });
				expect(result._author.isInitialized()).toBe(false);

				await result._author.load();
				expect(result._author.isInitialized()).toBe(true);
			});

			it('should throw an error if the author reference was not loaded', async () => {
				const result = await em.findOneOrFail(Book, { id: book.id });
				expect(() => result.author).toThrow();
			});
		});

		describe('getting the author full name', () => {
			it('should provide the full name if the author is loaded', async () => {
				const result = await em.findOneOrFail(Book, { id: book.id }, { populate: ['_author'] });
				expect(result.getAuthorFullName()).toEqual('John Doe');
			});

			it('should throw an error if the auhtor reference was not loaded', async () => {
				const result = await em.findOneOrFail(Book, { id: book.id });
				expect(() => result.getAuthorFullName()).toThrow();
			});
		});
	});
});
