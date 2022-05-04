const { expect } = require('chai');
const appPromise = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(appPromise);

const { setIdToken } = require('../../../../src/services/oauth2/hooks/index');

describe('oauth2 token test', () => {
	let app;
	let server;

	before(async () => {
		app = await appPromise;
		server = app.listen(0);
	});

	after(() => {
		server.close();
	});

	it('scope groups set', async () => {
        const testTeam = await testObjects.createTestTeamWithOwner();
        const testTool = await testObjects.createTestLtiTool();

        const result = await setIdToken({
            app,
            params: {
                consentRequest:{
                    requested_scope: "groups",
                    client: {
                        client_id: testTool.oAuthClientId
                    }
                },
                account: {
                    userId: testTeam.user._id
                },
                query: {
                    accept: true
                },
                school: {
                    features: []
                }
            },
            data:{
                session:{}
            }
        });

        expect(result).to.not.equal(undefined);
        expect(result.data.session.id_token.groups).to.not.equal(undefined);
	});

	it('scope groups unset', async () => {
        const testTeam = await testObjects.createTestTeamWithOwner();
        const testTool = await testObjects.createTestLtiTool();

        const result = await setIdToken({
            app,
            params: {
                consentRequest:{
                    requested_scope: "",
                    client: {
                        client_id: testTool.oAuthClientId
                    }
                },
                account: {
                    userId: testTeam.user._id
                },
                query: {
                    accept: true
                }
            },
            data:{
                session:{}
            }
        });

        expect(result).to.not.equal(undefined);
        expect(result.data.session.id_token.groups).to.equal(undefined);
	});
});