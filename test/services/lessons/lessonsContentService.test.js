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
			}
			params.route = {
				type: 'neXboard'
			}

			const course = await testObjects.createTestCourse({ userIds: [user._id]});
			const lesson = await testObjects.createTestLesson({ courseId: course._id })
			await app.service('lessons').patch(lesson._id, { $push: { contents: {
				title: 'testcontent',
				component: 'neXboard',
				content: {
					title:"sdfasd",
					description:"sdfasdf",
					board:"25380",
					url:"https://nexboard.nexenio.com/app/client/pub/25380/someid"
				}
			} } })

			const result = await app.service('/lessons/contents/:type/').find(
				params
			);
			
			expect(result.length).to.equal(1);
			expect(result[0].content.title).to.equal('sdfasd');
		});

		it('does not find a nexboard you have access to', async () => {
			const user = await testObjects.createTestUser();
			const params = await testObjects.generateRequestParamsFromUser(user);
			params.query = {
				type: 'neXboard',
				user: user._id,
			}
			params.route = {
				type: 'neXboard'
			}

			const course = await testObjects.createTestCourse({ userIds: []}); // user not in course
			const lesson = await testObjects.createTestLesson({ courseId: course._id })
			await app.service('lessons').patch(lesson._id, { $push: { contents: {
				title: 'testcontent',
				component: 'neXboard',
				content: {
					title:"sdfasd",
					description:"sdfasdf",
					board:"25380",
					url:"https://nexboard.nexenio.com/app/client/pub/25380/someid"
				}
			} } })

			const result = await app.service('/lessons/contents/:type/').find(
				params
			);
			
			expect(result.length).to.equal(0);
		});

		it('throws an error without userId', async () => {
			const user = await testObjects.createTestUser();
			const params = await testObjects.generateRequestParamsFromUser(user);
			params.query = {
				type: 'neXboard',
			}
			params.route = {
				type: 'neXboard'
			}

			const course = await testObjects.createTestCourse({ userIds: [user._id]}); // user not in course
			const lesson = await testObjects.createTestLesson({ courseId: course._id })
			await app.service('lessons').patch(lesson._id, { $push: { contents: {
				title: 'testcontent',
				component: 'neXboard',
				content: {
					title:"sdfasd",
					description:"sdfasdf",
					board:"25380",
					url:"https://nexboard.nexenio.com/app/client/pub/25380/someid"
				}
			} } })

			try {
				await app.service('/lessons/contents/:type/').find(
					params
				);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.code).to.equal(400);
				expect(err.message).to.equal('requires a user in the query');
			}
		});
	});
});

/*
result 
{"_id":"5ea2c6ad843b8d002b193106","content":{"title":"sdfasd","description":"sdfasdf","board":"25380","url":"
https://nexboard.nexenio.com/app/client/pub/25380/355n8800-j412-4ko8-g3b0-5553qz291615
"}}
*/