const rolesModel = require('../../../../../src/services/role/model.js');
const {userModel} = require('../../../../../src/services/user/model.js');
const accountModel = require('../../../../../src/services/account/model.js');

const app = require('../../../../../src/app');

const PASSWORD = 'Todd.Test123';

let account;
let user;

const setupAdmin = async (email='foo@bar.baz', schoolId='0000d186816abba584714c5f') => {
    const [administrator] = await rolesModel.find({
        name: 'administrator',
    });
    user = await userModel.create({
        email : email,
        schoolId : schoolId,
        firstName: 'Authenticated',
        lastName: 'User',
        roles: [
            administrator._id,
        ],
    });

    account = await app.service('accounts').create({
        username : email,
        password: PASSWORD,
        userId : user._id,
        activated : true,
    });
};

const getAdminToken = async () => {
    const result = await app.service('authentication').create({
        strategy: 'local',
        username: account.username,
        password: PASSWORD,
    }, {
        headers: {
            'content-type': 'application/json',
        },
        provider: 'rest',
    });
    return result.accessToken;
};

const deleteUser = async (email='foo@bar.baz') => {
    await userModel.deleteOne({email: email});
    await accountModel.deleteOne({username: email});
};

const createClass = async ([gradeLevelName, className, schoolId]) => {
    const gradeLevels = await app.service('gradeLevels').find({
        query: {
            name: gradeLevelName,
        },
        paginate: false,
    });
    let classObject;
    if (gradeLevels.length > 0) {
        classObject = {
            schoolId,
            nameFormat: 'gradeLevel+name',
            gradeLevel: gradeLevels[0]._id,
            name: className,
        };
    } else {
        classObject = {
            schoolId,
            nameFormat: 'static',
            name: className,
        };
    }
    await app.service('classes').create(classObject);
};

const findClass = async ([gradeLevelName, className]) => {
    const gradeLevels = await app.service('gradeLevels').find({
        query: {
            name: gradeLevelName,
        },
        paginate: false,
    });
    let classObject;
    if (gradeLevels.length > 0) {
        [classObject] = await app.service('classes').find({
            query: {
                nameFormat: 'gradeLevel+name',
                gradeLevel: gradeLevels[0]._id,
                name: className,
            },
            paginate: false,
        });
    } else {
        [classObject] = await app.service('classes').find({
            query: {
                nameFormat: 'static',
                name: className,
            },
            paginate: false,
        });
    }
    return classObject;
};

const deleteClass = async ([gradeLevelName, className]) => {
    const classObject = await findClass([gradeLevelName, className]);
    await app.service('classes').remove(classObject._id);
};

module.exports = {
    setupAdmin,
    getAdminToken,
    deleteUser,
    createClass,
    findClass,
    deleteClass,
};
