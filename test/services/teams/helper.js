const SRC = '../../../src/';
const rolesModel = require(SRC + 'services/role/model.js');
const { userModel } = require(SRC + 'services/user/model.js');
const accountModel = require(SRC + 'services/account/model.js');
const app = require(SRC + 'app');
const { BadRequest } = require('feathers-errors');
const { ObjectId } = require('mongoose').Types;



const PASSWORD = process.env.TEST_PW;
const REQUEST_PARAMS = {
    headers: {'content-type': 'application/json'},
    provider: 'rest',
};

//let account;
//let user;

const login = (userId) => {
    return app.service('authentication').create({
        strategy: 'local',
        username: userId + '@schul-cloud.org',
        password: PASSWORD,
    },REQUEST_PARAMS).then(result=>{
        
        return result;
    });
};

const createUser = async (userId, roleName = 'student', schoolId = '0000d186816abba584714c5f') => {

    if (!['student', 'teacher', 'parent', 'administrator'].includes(roleName)) {  //superhero is not added 
        throw BadRequest('You want to test a not related role .' + roleName);
    }

    const [role] = await rolesModel.find({
        name: roleName
    });

    return await userModel.create({
        _id: userId,
        email: userId + '@schul-cloud.org',
        schoolId,
        firstName: userId,
        lastName: 'GerneratedTestUser',
        roles: [
            role._id,
        ],
    });
};

const createAccount = async (userId) => {
    return await app.service('accounts').create({
        username: userId + '@schul-cloud.org',
        password: PASSWORD,
        userId,
        activated: true,
    });
};

const setupUser = async (roleName, schoolId) => {
    const userId = ObjectId();

    return Promise.all([createUser(userId, roleName, schoolId), createAccount(userId)]).then(async ([user, account]) => {
        const { accessToken } = await login(account);
        return { userId, account, user, accessToken };
    });

};

const deleteUser = async (userId) => {
    const email = userId + '@schul-cloud.org';
    await userModel.deleteOne({ email });     //todo: add error handling if not exist
    await accountModel.deleteOne({ username: email });
};

class MockEmailService {
    constructor(eventHandler) {
        this.eventHandler = eventHandler;
    }

    create({ headers, email, subject, content }, params) {
        this.eventHandler({ subject, content });
        return Promise.resolve();
    }
}

module.exports = {
    setupUser,
    login,
    deleteUser,
    MockEmailService
};