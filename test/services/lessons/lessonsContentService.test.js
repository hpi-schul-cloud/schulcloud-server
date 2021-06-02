const { expect } = require('chai');
const appPromise = require('../../../src/app');

const testObjects = require('../helpers/testObjects')(appPromise);
// const { equal: equalIds } = require('../../../src/helper/compare').ObjectId;
// const { userModel } = require('../../../src/services/user/model');

describe('Lesson Content Service', () => {
	let app;
	let server;

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
	});

	after(async () => {
		await testObjects.cleanup();
		await server.close();
	});

	describe('find nexboards', () => {
		it('finds a nexboard you have access to', async () => {
			const user = await testObjects.createTestUser();
			const params = await testObjects.generateRequestParamsFromUser(user);
			params.query = {
				type: 'neXboard',
				user: user._id,
			};
			params.route = {
				type: 'neXboard',
			};

			const course = await testObjects.createTestCourse({ userIds: [user._id] });
			const lesson = await testObjects.createTestLesson({ courseId: course._id });
			await app.service('lessons').patch(lesson._id, {
				$push: {
					contents: {
						title: 'testcontent',
						component: 'neXboard',
						content: {
							title: 'sdfasd',
							description: 'sdfasdf',
							board: '25380',
							url: 'https://nexboard.nexenio.com/app/client/pub/25380/someid',
						},
					},
				},
			});

			const result = await app.service('/lessons/contents/:type/').find(params);

			expect(result.length).to.equal(1);
			expect(result[0].content.title).to.equal('sdfasd');
		});

		it('does not find a nexboard you have access to', async () => {
			const user = await testObjects.createTestUser();
			const params = await testObjects.generateRequestParamsFromUser(user);
			params.query = {
				type: 'neXboard',
				user: user._id,
			};
			params.route = {
				type: 'neXboard',
			};

			const course = await testObjects.createTestCourse({ userIds: [] }); // user not in course
			const lesson = await testObjects.createTestLesson({ courseId: course._id });
			await app.service('lessons').patch(lesson._id, {
				$push: {
					contents: {
						title: 'testcontent',
						component: 'neXboard',
						content: {
							title: 'sdfasd',
							description: 'sdfasdf',
							board: '25380',
							url: 'https://nexboard.nexenio.com/app/client/pub/25380/someid',
						},
					},
				},
			});

			const result = await app.service('/lessons/contents/:type/').find(params);

			expect(result.length).to.equal(0);
		});

		it('finds a nexboard that is visible', async () => {
			const user = await testObjects.createTestUser();
			const params = await testObjects.generateRequestParamsFromUser(user);
			params.query = {
				type: 'neXboard',
				user: user._id,
			};
			params.route = {
				type: 'neXboard',
			};

			const course = await testObjects.createTestCourse({ userIds: [user._id] });
			const lesson = await testObjects.createTestLesson({ courseId: course._id });
			await app.service('lessons').patch(lesson._id, {
				$push: {
					contents: {
						title: 'testcontent',
						component: 'neXboard',
						hidden: false,
						content: {
							title: 'sdfasd',
							description: 'sdfasdf',
							board: '25380',
							url: 'https://nexboard.nexenio.com/app/client/pub/25380/someid',
						},
					},
				},
			});

			const result = await app.service('/lessons/contents/:type/').find(params);

			expect(result.length).to.equal(1);
			expect(result[0].content.title).to.equal('sdfasd');
		});

		it('does not find a nexboard that is hidden', async () => {
			const user = await testObjects.createTestUser();
			const params = await testObjects.generateRequestParamsFromUser(user);
			params.query = {
				type: 'neXboard',
				user: user._id,
			};
			params.route = {
				type: 'neXboard',
			};

			const course = await testObjects.createTestCourse({ userIds: [user._id] });
			const lesson = await testObjects.createTestLesson({ courseId: course._id });
			await app.service('lessons').patch(lesson._id, {
				$push: {
					contents: {
						title: 'testcontent',
						component: 'neXboard',
						hidden: true,
						content: {
							title: 'sdfasd',
							description: 'sdfasdf',
							board: '25380',
							url: 'https://nexboard.nexenio.com/app/client/pub/25380/someid',
						},
					},
				},
			});

			const result = await app.service('/lessons/contents/:type/').find(params);

			expect(result.length).to.equal(0);
		});
	});
});
