const { setupUser, deleteUser, MockEmailService } = require('./helper');

setupUser().then(({ account, user, accessToken }) => {
    console.log(account, user, accessToken);
});