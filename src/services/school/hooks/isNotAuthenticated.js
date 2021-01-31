module.exports = async (context) => {
    if (typeof context.params.provider==='undefined') {
        return false;
    }
    return !((context.params.headers || {}).authorization || (context.params.account && context.params.account.userId));
};