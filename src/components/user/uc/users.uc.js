const {ObjectId} = require('mongoose').Types;

const {GeneralError, NotFound} = require('../../../errors');

module.exports = class UserUC {
    constructor(app) {
        this.userRepo = app.service('userRepo');
        this.accountRepo = app.service('accountRepo');
        this.trashbinRepo = app.service('trashbinRepo');
    }

    async getUserData(id) {
        const data = {};

        const user = await this.userRepo.getUser(id);
        if (!(user && user._id && !user.deletedAt)) {
            throw new NotFound(`User ${id} not found`);
        }
        data.user = user;

        const account = await this.accountRepo.getUserAccount(id);
        if (account) {
            data.account = account;
        }
        return data;
    };

    async deleteUserData(id) {
        await this.accountRepo.deleteUserAccount(id);
    };

    async createUserTrashbin(id, data) {
        const trashBin = await this.trashbinRepo.createUserTrashbin(id, data);
        if (!(trashBin && trashBin._id)) {
            throw new GeneralError(`Unable to initiate trashBin`);
        }
        return trashBin;
    };


    async replaceUserWithTombstoneUC(id) {
        const uid = ObjectId();
        await this.userRepo.replaceUserWithTombstone(id,{
            firstName: 'DELETED',
            lastName: 'USER',
            email: `${uid}@deleted`,
            deletedAt: new Date(),
        });
        return {success: true};
    };

    async deleteUserUC(id) {
        const data = await this.getUserData(id);

        const trashBin = await this.createUserTrashbin(id, data);

        await this.replaceUserWithTombstoneUC(id);

        await this.deleteUserData(id);

        return trashBin;
    };
};

