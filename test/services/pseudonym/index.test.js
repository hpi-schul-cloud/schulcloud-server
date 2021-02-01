const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { ObjectId } = require('mongoose').Types;
const appPromise = require('../../../src/app');
const { MethodNotAllowed, BadRequest } = require('../../../src/errors');

const PseudonymModel = require('../../../src/services/pseudonym/model');

const {
	cleanup,
	createTestUser,
	createTestLtiTool,
	createTestPseudonym,
	generateRequestParamsFromUser,
} = require('../helpers/testObjects')(appPromise); // todo import everything

chai.use(chaiAsPromised);
const { expect } = chai;

describe('pseudonym service', function pseudonymTest() {
	let app;
	let pseudonymService;
	let server;
	this.timeout(10000);

	const createTestData = async () => {
		const testUser = await createTestUser();
		const testTool = await createTestLtiTool();
		return { testUser, testTool };
	};

	const getPseudonyms = async (user, tool) => {
		const result = pseudonymService.find({
			query: {
				userId: user._id,
				toolId: tool._id,
			},
		});
		return result;
	};

	const expectValidPseudonym = (pseudonymModelTO) => {
		expect(ObjectId.isValid(pseudonymModelTO.userId)).to.be.true;
		expect(ObjectId.isValid(pseudonymModelTO.toolId)).to.be.true;
		expect(pseudonymModelTO.pseudonym).to.be.an('string');
		expect(pseudonymModelTO.pseudonym.length).to.be.greaterThan(0);
	};

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
		pseudonymService = app.service('pseudonym');
	});

	after(async () => {
		await PseudonymModel.remove({}).exec();
		await cleanup();
		await server.close();
	});

	it('is registered', () => {
		expect(app.service('pseudonym')).to.be.ok;
	});

	it('throws MethodNotAllowed on GET', async () => {
		const { testTool } = await createTestData();
		expect(pseudonymService.get(testTool._id)).to.be.rejectedWith(MethodNotAllowed);
	});

	it('throws MethodNotAllowed on UPDATE', async () => {
		const { testTool } = await createTestData();
		expect(pseudonymService.update(testTool._id, {})).to.be.rejectedWith(MethodNotAllowed);
	});

	it('throws MethodNotAllowed on PATCH', async () => {
		const { testTool } = await createTestData();
		expect(pseudonymService.patch(testTool._id, {})).to.be.rejectedWith(MethodNotAllowed);
	});

	it('throws MethodNotAllowed on external call to REMOVE', async () => {
		const user = await createTestUser({ roles: 'teacher' });
		const params = await generateRequestParamsFromUser(user);
		const { testTool } = await createTestData();
		expect(pseudonymService.remove(testTool._id, params)).to.be.rejectedWith(MethodNotAllowed);
	});

	it('does not throw and deletes a pseudonym on internal call to REMOVE', async () => {
		const { testUser, testTool } = await createTestData();
		const pseudonym = await createTestPseudonym({}, testTool, testUser);
		expect(await PseudonymModel.findById(pseudonym._id)).to.not.equal(null);
		await pseudonymService.remove(pseudonym._id);
		expect(await PseudonymModel.findById(pseudonym._id)).to.equal(null);
	});

	it('returns a pseudonym which will be created on first request and then reused for same tool', async () => {
		const { testUser, testTool } = await createTestData();
		const responseWithPseudonymNewlyCreated = await getPseudonyms(testUser, testTool);
		expect(responseWithPseudonymNewlyCreated.data).to.be.an('array').of.length(1);
		const { pseudonym } = responseWithPseudonymNewlyCreated.data[0];
		expect(pseudonym).to.be.an('string');
		expect(pseudonym.length).to.be.greaterThan(0);
		const secondResponseWithSamePseudonym = await getPseudonyms(testUser, testTool);
		expect(secondResponseWithSamePseudonym.data).to.be.an('array').of.length(1);
		const samePseudonym = secondResponseWithSamePseudonym.data[0].pseudonym;
		expect(samePseudonym).to.deep.equal(pseudonym);
	});

	it('returns existing pseudonym on FIND for derived tool', async () => {
		const testUser = await createTestUser();
		const testTemplateTool = await createTestLtiTool({ isTemplate: true });
		const testTool = await createTestLtiTool({ isTemplate: false, originTool: testTemplateTool._id });

		// create pseudonym for template tool by find
		const pseudonymsTemplateResponse = await getPseudonyms(testUser, testTemplateTool);
		const templateToolPseudonym = pseudonymsTemplateResponse.data[0];

		// derived tool should resolve with same pseudonym
		const pseudonymsResponse = await getPseudonyms(testUser, testTool);
		const derivedTemplatePseudonym = pseudonymsResponse.data[0];

		expectValidPseudonym(templateToolPseudonym);
		expect(templateToolPseudonym).to.deep.equal(derivedTemplatePseudonym);
	});

	it('returns existing pseudonym on FIND for origin tool', async () => {
		const testUser = await createTestUser();
		const testTemplateTool = await createTestLtiTool({ isTemplate: true });
		const testTool = await createTestLtiTool({ isTemplate: false, originTool: testTemplateTool._id });

		// create pseudonym for derived tool by find
		const pseudonymsResponse = await getPseudonyms(testUser, testTool);
		const derivedTemplatePseudonym = pseudonymsResponse.data[0];

		// origin tool should resolve with same pseudonym
		const pseudonymsTemplateResponse = await getPseudonyms(testUser, testTemplateTool);
		const templateToolPseudonym = pseudonymsTemplateResponse.data[0];

		expectValidPseudonym(templateToolPseudonym);
		expect(templateToolPseudonym).to.deep.equal(derivedTemplatePseudonym);
	});

	it('creates missing pseudonyms on FIND with multiple users', async () => {
		const { testUser, testTool } = await createTestData();
		const secondTestUser = await createTestUser();

		const response = await pseudonymService.find({
			query: {
				userId: [testUser._id, secondTestUser._id],
				toolId: testTool._id,
			},
		});
		const { data } = response;
		expect(data).to.be.a('array').of.length(2);
		data.forEach((pseudonymTO) => expectValidPseudonym(pseudonymTO));
		expect(data.map((pseudonym) => pseudonym.userId.toString())).to.include.members([
			testUser._id.toString(),
			secondTestUser._id.toString(),
		]);
		expect(data[0].pseudonym).to.be.not.equal(data[1].pseudonym);
	});

	it("doesn't create pseudonyms on FIND for missing users", async () => {
		const { testTool } = await createTestData();
		expect(
			pseudonymService.find({
				query: {
					userId: new ObjectId(), // not existing userId
					toolId: testTool._id, // existing toolId
				},
			})
		).to.be.rejectedWith(BadRequest);
	});

	it("doesn't create pseudonyms on FIND for missing tool", async () => {
		const { testUser } = await createTestData();
		expect(
			pseudonymService.find({
				query: {
					toolId: new ObjectId(), // not existing toolId
					userId: testUser._id, // existing userId
				},
			})
		).to.be.rejectedWith(BadRequest);
	});
});
