import { Collection, Entity, Enum, ManyToMany, ManyToOne, Property } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { MongoMemoryDatabaseModule } from '@shared/infra/database/mongo-memory-database/mongo-memory-database.module';
import { cleanupCollections } from '@shared/testing/cleanup-collections';

@Entity({ tableName: 'users' })
class User extends BaseEntityWithTimestamps {
	@Property()
	firstName: string;

	@Property()
	lastName: string;

	constructor(props: { firstName: string; lastName: string }) {
		super();
		this.firstName = props.firstName;
		this.lastName = props.lastName;
	}
}

@Entity({ tableName: 'schools' })
class School extends BaseEntityWithTimestamps {
	@Property()
	name: string;

	@ManyToMany({ entity: () => User, fieldName: 'students' })
	students = new Collection<User>(this);

	constructor(props: { name: string }) {
		super();
		this.name = props.name;
	}
}

@Entity({ tableName: 'courses' })
class Course extends BaseEntityWithTimestamps {
	@Property()
	name: string;

	@ManyToMany({ entity: () => User, fieldName: 'studentIds' })
	students = new Collection<User>(this);

	@ManyToMany({ entity: () => User, fieldName: 'teacherIds' })
	teachers = new Collection<User>(this);

	constructor(props: { name: string }) {
		super();
		this.name = props.name;
		this.students.set([]);
		this.teachers.set([]);
	}
}

@Entity({ tableName: 'news', abstract: true, discriminatorColumn: 'targetModel' })
abstract class News extends BaseEntityWithTimestamps {
	@Property()
	title: string;

	@Enum({ items: () => ['schools', 'courses'] })
	targetModel!: 'schools' | 'courses';

	constructor(props: { title: string }) {
		super();
		this.title = props.title;
	}
}

@Entity({ tableName: 'news', discriminatorValue: 'schools' })
class SchoolNews extends News {
	@ManyToOne({ entity: () => School, fieldName: 'target' })
	target: School;

	constructor(props: { title: string; target: School }) {
		super({ title: props.title });
		this.target = props.target;
	}
}

@Entity({ tableName: 'news', discriminatorValue: 'schools' })
class CourseNews extends News {
	@ManyToOne({ entity: () => Course, fieldName: 'target' })
	target: Course;

	constructor(props: { title: string; target: Course }) {
		super({ title: props.title });
		this.target = props.target;
	}
}

describe('News mapping', () => {
	let em: EntityManager;
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [User, School, Course, News, SchoolNews, CourseNews] })],
		}).compile();

		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	it('should persist course news', async () => {
		const course = new Course({ name: 'course #1' });
		const news = new CourseNews({ title: 'course news #1', target: course });

		await em.persistAndFlush(news);
		em.clear();

		const result = await em.findOneOrFail(CourseNews, news.id);
		expect(result).toBeDefined();
		expect(result.target.id).toEqual(course.id);
	});
});
