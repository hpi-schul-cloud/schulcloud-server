import { ObjectId } from '@mikro-orm/mongodb';
import { Class } from '../class.do';
import { classFactory } from './factory/class.factory';
import { ClassSourceOptions } from '../class-source-options.do';

describe(Class.name, () => {
	describe('constructor', () => {
		describe('When constructor is called', () => {
			it('should create a class by passing required properties', () => {
				const domainObject: Class = classFactory.build();

				expect(domainObject instanceof Class).toEqual(true);
			});
		});

		describe('when passed a valid id', () => {
			const setup = () => {
				const domainObject: Class = classFactory.build({ id: new ObjectId().toHexString() });

				return { domainObject };
			};

			it('should set the id', () => {
				const { domainObject } = setup();

				const classDomainObject: Class = new Class(domainObject);

				expect(classDomainObject.id).toEqual(domainObject.id);
			});
		});
	});
	describe('getters', () => {
		describe('When getters are used', () => {
			it('getters should return proper values', () => {
				const props = {
					id: new ObjectId().toHexString(),
					name: `name1`,
					schoolId: new ObjectId().toHexString(),
					userIds: [new ObjectId().toHexString(), new ObjectId().toHexString()],
					teacherIds: [new ObjectId().toHexString(), new ObjectId().toHexString()],
					invitationLink: `link-1`,
					year: new ObjectId().toHexString(),
					gradeLevel: 1,
					ldapDN: `dn-$1`,
					successor: new ObjectId().toHexString(),
					source: `source-1`,
					sourceOptions: new ClassSourceOptions({ tspUid: `id-1` }),
					createdAt: new Date(),
					updatedAt: new Date(),
				};

				const classDo = new Class(props);
				const gettersValues = {
					id: classDo.id,
					name: classDo.name,
					schoolId: classDo.schoolId,
					userIds: classDo.userIds,
					teacherIds: classDo.teacherIds,
					invitationLink: classDo.invitationLink,
					year: classDo.year,
					gradeLevel: classDo.gradeLevel,
					ldapDN: classDo.ldapDN,
					successor: classDo.successor,
					source: classDo.source,
					sourceOptions: classDo.sourceOptions,
					createdAt: classDo.createdAt,
					updatedAt: classDo.updatedAt,
				};

				expect(gettersValues).toEqual(props);
			});
		});
	});
	describe('removeUsers', () => {
		describe('When function is called', () => {
			it('domainObject userIds table should be updated and userId should be removed', () => {
				const userToDeleteId = new ObjectId().toHexString();
				const user2 = new ObjectId().toHexString();
				const user3 = new ObjectId().toHexString();

				const domainObject = classFactory.withUserIds([userToDeleteId, user2, user3]).build();

				domainObject.removeUser(userToDeleteId);

				expect(domainObject.userIds).toEqual([user2, user3]);
			});
		});
	});

	describe('getClassFullName', () => {
		describe('When function is called', () => {
			it('should return full class name consisting of grade level and class name', () => {
				const gradeLevel = 1;
				const name = 'A';
				const domainObject = classFactory.build({ name, gradeLevel });

				const result = domainObject.getClassFullName();

				expect(result).toEqual('1A');
			});

			it('should return full class name consisting of class name only', () => {
				const gradeLevel = undefined;
				const name = 'A';
				const domainObject = classFactory.build({ name, gradeLevel });

				const result = domainObject.getClassFullName();

				expect(result).toEqual('A');
			});
		});
	});
});
