import { expect } from 'chai';
import { mix } from 'mixwith';
import ClassImporter from '../../../../../src/services/sync/strategies/mixins/ClassImporter';
import Syncer from '../../../../../src/services/sync/strategies/Syncer';
import appPromise from '../../../../../src/app';
import testObjectsImport from '../../../helpers/testObjects'; 

const { createTestSchool, createTestClass, cleanup } = testObjectsImport(appPromise);

describe('Syncer Mixins', () => {
	describe('ClassImporter', () => {
		let app;

		const MIXIN_METHODS = ['buildClassMapping', 'createOrUpdateClass', 'findClass', 'createClass', 'updateClass'];
		const SampleSyncer = class extends Syncer {};
		const MixedClass = mix(Syncer).with(ClassImporter);

		let server;

		before(async () => {
			app = await appPromise;
			server = await app.listen(0);
		});

		after((done) => {
			server.close(done);
		});

		it('returns a mixin factory', () => {
			expect(ClassImporter).to.be.instanceOf(Function);
		});

		it('cannot be instantiated directly', () => {
			try {
				// eslint-disable-next-line no-new
				new ClassImporter();
				throw new Error('The previous call should have failed.');
			} catch (err) {
				expect(err).to.be.instanceOf(TypeError);
				expect(err.message).to.contains('is not a constructor');
			}
		});

		it('extends a Syncer subclass with class-related operations', () => {
			const undecoratedInstance = new SampleSyncer();
			MIXIN_METHODS.forEach((method) => expect(undecoratedInstance[method]).to.equal(undefined));
			const decoratedInstance = new MixedClass();
			MIXIN_METHODS.forEach((method) => expect(decoratedInstance[method]).to.not.equal(undefined));
		});

		it('adds empty class stats to the syncer stats', () => {
			const instance = new MixedClass();
			expect(instance.stats.classes).to.be.ok;
			expect(instance.stats.classes.successful).to.equal(0);
			expect(instance.stats.classes.failed).to.equal(0);
			expect(instance.stats.classes.created).to.equal(0);
			expect(instance.stats.classes.updated).to.equal(0);
		});

		describe('#findClass', () => {
			after(cleanup);

			it('returns null if no class was found', async () => {
				const result = await new MixedClass(app).findClass({ foo: 'bar' });
				expect(result).to.be.null;
			});

			it('finds classes using the class service', async () => {
				const identifier = 'myVeryUniqueClassName123';
				const existingClass = await createTestClass({ name: identifier });
				const result = await new MixedClass(app).findClass({ name: identifier });
				expect(result._id.toString()).to.deep.equal(existingClass._id.toString());
			});
		});

		describe('#createClass', () => {
			after(cleanup);

			it('allows creating a class', async () => {
				const { _id: schoolId } = await createTestSchool();
				const result = await new MixedClass(app).createClass({ name: 'foo', schoolId });
				expect(result).to.be.ok;
				expect(result.name).to.equal('foo');
				// cleanup:
				await app.service('classes').remove(result._id);
			});

			it('increases the number of created classes on success', async () => {
				const { _id: schoolId } = await createTestSchool();
				const instance = new MixedClass(app);
				const firstClass = await instance.createClass({ name: 'foo', schoolId });
				expect(instance.stats.classes.created).to.equal(1);
				const secondClass = await instance.createClass({ name: 'bar', schoolId });
				expect(instance.stats.classes.created).to.equal(2);
				// cleanup:
				await app.service('classes').remove(firstClass._id);
				await app.service('classes').remove(secondClass._id);
			});

			it('logs an error if the class creation fails', async () => {
				const instance = new MixedClass({
					service: () => ({
						create: () => {
							throw new Error('Go fork yourself!');
						},
					}),
				});
				const { _id: schoolId } = await createTestSchool();
				await instance.createClass({ name: 'foo', schoolId });
				expect(instance.stats.classes.created).to.equal(0);
				expect(instance.stats.classes.failed).to.equal(1);
				expect(instance.stats.errors.length).to.equal(1);
				expect(instance.stats.errors[0].type).to.equal('class');
			});
		});

		describe('#updateClass', () => {
			after(cleanup);

			it('allows updating a class by id', async () => {
				const existingClass = await createTestClass({ name: 'foo' });
				const result = await new MixedClass(app).updateClass(existingClass._id, { name: 'barz' });
				expect(result._id.toString()).to.deep.equal(existingClass._id.toString());
				expect(result.name).to.equal('barz');
			});

			it('increases the number of updated classes on success', async () => {
				const instance = new MixedClass(app);
				const existingClass = await createTestClass({ name: 'foo' });
				await instance.updateClass(existingClass._id, { name: 'barz' });
				expect(instance.stats.classes.updated).to.equal(1);
				await instance.updateClass(existingClass._id, { name: 'spam' });
				expect(instance.stats.classes.updated).to.equal(2);
			});

			it('logs an error if the class update fails', async () => {
				const instance = new MixedClass({
					service: () => ({
						patch: () => {
							throw new Error('Go fork yourself!');
						},
					}),
				});
				const existingClass = await createTestClass({ name: 'foo' });
				await instance.updateClass(existingClass._id, { name: 'barz' });
				expect(instance.stats.classes.updated).to.equal(0);
				expect(instance.stats.classes.failed).to.equal(1);
				expect(instance.stats.errors.length).to.equal(1);
				expect(instance.stats.errors[0].type).to.equal('class');
			});
		});

		describe('#createOrUpdateClass', () => {
			after(cleanup);

			it('updates an existing class and returns it using a given query', async () => {
				const identifier = '45678djerf734cirtbciw4vrti4bcw34kcnk8';
				const existing = await createTestClass({ name: identifier });
				const instance = new MixedClass(app);
				const result = await instance.createOrUpdateClass({ name: 'new name' }, { name: identifier });
				expect(result._id.toString()).to.equal(existing._id.toString());
				expect(result.name).to.not.equal(existing.name);
				expect(result.name).to.equal('new name');
			});

			it('creates a new class if none exists for the search query', async () => {
				const identifier = '45678djerf734cirtbciw4vrti4bcw34kcnk8';
				const { _id: schoolId } = await createTestSchool();
				const instance = new MixedClass(app);
				const result = await instance.createOrUpdateClass({ name: 'check', schoolId }, { name: identifier });
				expect(result).to.be.ok;
				expect(result.name).to.equal('check');
				// cleanup:
				await app.service('classes').remove(result._id);
			});

			it('uses the classObject as search query if query is undefined', async () => {
				const { _id: schoolId } = await createTestSchool();
				const instance = new MixedClass(app);
				const created = await instance.createOrUpdateClass({ name: 'mark', schoolId });
				expect(created).to.be.ok;
				expect(created.name).to.equal('mark');
				const updated = await instance.createOrUpdateClass({ name: 'mark' });
				expect(updated).to.be.ok;
				expect(updated._id.toString()).to.equal(created._id.toString());
				expect(updated.name).to.equal('mark');
				expect(updated.schoolId.toString()).to.equal(schoolId.toString());
				// cleanup:
				await app.service('classes').remove(updated._id);
			});

			it('processes errors and adds them to the syncer stats', async () => {
				const instance = new MixedClass({
					service: () => ({
						find: () => {
							throw new Error('Go fork yourself!');
						},
					}),
				});
				const result = await instance.createOrUpdateClass({ name: 'beep boop boop' });
				expect(instance.stats.classes.created).to.equal(0);
				expect(instance.stats.classes.updated).to.equal(0);
				expect(instance.stats.classes.failed).to.equal(1);
				expect(instance.stats.errors.length).to.equal(1);
				expect(instance.stats.errors[0].type).to.equal('class');
				expect(result).to.be.null;
			});
		});

		describe('#buildClassMapping', () => {
			after(cleanup);

			it('works if no classes are given', async () => {
				const instance = new MixedClass(app);
				const result = await instance.buildClassMapping([], {});
				expect(result).to.deep.equal({});
			});

			it("creates new classes if they don't exist", async () => {
				const classes = ['1a', '2b', '3c'];
				const instance = new MixedClass(app);
				const { _id: schoolId } = await createTestSchool();
				const result = await instance.buildClassMapping(classes, { schoolId });
				await Promise.all(
					classes.map(async (c) => {
						expect(result[c]).to.not.equal(undefined);
						expect(result[c]._id).to.not.equal(undefined);
						// cleanup:
						await app.service('classes').remove(result[c]._id);
					})
				);
				expect(instance.stats.classes.created).to.equal(3);
				expect(instance.stats.classes.updated).to.equal(0);
				expect(instance.stats.classes.successful).to.equal(3);
				expect(instance.stats.classes.failed).to.equal(0);
			});

			it('creates new classes only once', async () => {
				const classes = ['1a', '1a', '1a'];
				const instance = new MixedClass(app);
				const { _id: schoolId } = await createTestSchool();
				const result = await instance.buildClassMapping(classes, { schoolId });
				expect(result['1a']).to.not.equal(undefined);
				expect(result['1a']._id).to.not.equal(undefined);
				// cleanup:
				await app.service('classes').remove(result['1a']._id);
				expect(instance.stats.classes.created).to.equal(1);
				expect(instance.stats.classes.updated).to.equal(0);
				expect(instance.stats.classes.successful).to.equal(1);
				expect(instance.stats.classes.failed).to.equal(0);
			});

			it('updates existing classes of the same name and school', async () => {
				const classes = ['1a'];
				const instance = new MixedClass(app);
				const { _id: schoolId } = await createTestSchool();
				const existing1a = await createTestClass({
					gradeLevel: 1,
					name: 'a',
					schoolId,
				});
				const result = await instance.buildClassMapping(classes, { schoolId });
				expect(result['1a']._id.toString()).to.equal(existing1a._id.toString());
				expect(instance.stats.classes.created).to.equal(0);
				expect(instance.stats.classes.updated).to.equal(1);
				expect(instance.stats.classes.successful).to.equal(1);
				expect(instance.stats.classes.failed).to.equal(0);
			});
		});
	});
});
