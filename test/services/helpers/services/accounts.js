let createdaccountsIds = [];

// should rewrite
const createTestAccount = (appPromise) => async (accountParameters, system, user) => {
    const app = await appPromise;
    if (system) {
        accountParameters.systemId = system._id;
    }
    accountParameters.userId = user._id;
    const account = await app.service('accounts').create(accountParameters);
    createdaccountsIds.push(account._id.toString());
    return account;
};

const cleanup = (appPromise) => async () => {
    const app = await appPromise;
    if (createdaccountsIds.length===0) {
        return Promise.resolve();
    }

    for (const id of createdaccountsIds) {
        try {
            await app.service('accounts').remove(typeof id !== 'string' ? id.toString() : id);
        } catch (e) {
            throw e;
        }
    }
    createdaccountsIds = [];
};

module.exports = (app, opt) => ({
    create: createTestAccount(app, opt),
    cleanup: cleanup(app),
    info: createdaccountsIds,
});
