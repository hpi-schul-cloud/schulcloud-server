// todo enable after reactivation
// const { BadRequest } = require('@feathersjs/errors');
// const { validateParams } = require('../../../src/services/lesson/hooks/addMaterial.js');
// // todo: add more fulfilling tests
// describe.skip('lessons service', () => {
// 	it('registered the lessons service', () => {
// 		const context0 = {
// 			noData: 'my Data is missing',
// 		};
// 		const context1 = {
// 			data: 'Here is some data, but wrong type',
// 		};
// 		const context2 = {
// 			data: ['Foo', 'bar', 'baz'],
// 		};
// 		const [title, client, url] = [42, undefined, null];
// 		const context3 = {
// 			data: [title, client, url],
// 		};

// 		const context4 = {
// 			data: ['title', 'client', 'url'],
// 		};
// 		const test0 = validateParams(context0); // expect to fail
// 		const test1 = validateParams(context1);
// 		const test2 = validateParams(context2);
// 		const test3 = validateParams(context3);
// 		const test4 = validateParams(context4); // expect to succeed


// 		chai.expect(test0).to.be.instanceOf(BadRequest);
// 		chai.expect(test1).to.be.instanceOf(BadRequest);
// 		chai.expect(test2).to.be.instanceOf(BadRequest);
// 		chai.expect(test3).to.be.instanceOf(BadRequest);
// 		chai.expect(test4).not.to.be.instanceOf(BadRequest);
// 	});
// });
