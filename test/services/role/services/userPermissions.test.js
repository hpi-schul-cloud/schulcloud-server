const { expect } = require('chai');
const app = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(app);

const userPermissions = app.service('/permissions/user');

describe('userPermissions', async () => {
	const ROLES = {
		TEST: 'test',
		OTHER: 'other',
		EXTENDED: 'extended',
		MULTIPLE: 'multiple',
		XX: 'xx',
		NOTHING: 'nothing spezial',
  };
  const testPermissions = [
		'SINGING',
		'DANCE_RAIN',
		'WALK_LINES',
		'RUN_FLOOR',
  ];
  
  	const otherPermissions = [
		'SITTING',
		'SITTING_ON_CHAIR',
		'SITTING_ON_DESK',
	];
  
	before(async () => {
		const testRole = await testObjects.createTestRole({
			name: ROLES.TEST,
			permissions: testPermissions,
    });
    
    const testRoleWithDiffrentPermissons = await testObjects.createTestRole({
			name: ROLES.TEST,
			permissions: otherPermissions,
		});

		const otherRole = await testObjects.createTestRole({
			name: ROLES.OTHER,
			permissions: otherPermissions,
		});

    // TestSchool
    const testSchool = await testObjects.createTestSchool({
       permissions: [testPermissions],
    })

    const testSchoolWithoutRole = await testObjects.createTestSchool({
    });

    //TestUser
    const testUser = await testObjects.createTestUser({
      schoolId: testSchool._id,
      roles: [testRole],
    });

    const testUser2 = await testObjects.createTestUser({
      schoolId: testSchool._id,
      roles: [testRoleWithDiffrentPermissons],
    });


    const otherUser = await testObjects.createTestUser({
      schoolId: testSchoolWithoutRole._id,
      roles: [otherRole],
    });

    });

	after(() => {
		testObjects.cleanup();
	});

	it('registered the service', () => {
		expect(userPermissions).to.not.equal(undefined);
	});
	it('get updated permissions', async () => {
		const roles = await userPermissions.get({
			id: testUser._id
    });
    const result = roles.map((role) => role.permissions);
    expect(result).to.equal(testRole.permissions);
	});
	it('should remove unnecessary permissions', async () => {
    const roles = await userPermissions.get({
      id: testUser2._id
    });
    const result = roles.map((role) => role.permissions);
    expect(result).to.not.equal(testRoleWithDiffrentPermissons.permissions);
  });

});
