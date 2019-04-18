const service = require('feathers-mongoose');
const CryptoJS = require('crypto-js');
const RandExp = require('randexp');
const Chance = require('chance');
const account = require('./model');
const hooks = require('./hooks');
const hooksCJWT = require('./hooksCJWT');

const chance = new Chance();

class CustomJWTService {
    constructor(authentication) {
        this.authentication = authentication;
    }

    create(data) {
        return account.findOne({ userId: data.userId })
            .then((account) => {
                const header = {
                    alg: 'HS256',
                    typ: 'access',
                };

                const data = {
                    accountId: account._id,
                    userId: account.userId,
                    iat: new Date().valueOf(),
                    exp: new Date().valueOf() + 86400,
                    aud: 'https://schul-cloud.org',
                    iss: 'feathers',
                    sub: 'anonymous',
                };

                const secret = this.authentication;

                function base64url(source) {
                    // Encode in classical base64
                    let encodedSource = CryptoJS.enc.Base64.stringify(source);

                    // Remove padding equal characters
                    encodedSource = encodedSource.replace(/=+$/, '');

                    // Replace characters according to base64url specifications
                    encodedSource = encodedSource.replace(/\+/g, '-');
                    encodedSource = encodedSource.replace(/\//g, '_');

                    return encodedSource;
                }

                const stringifiedHeader = CryptoJS.enc.Utf8.parse(JSON.stringify(header));
                const encodedHeader = base64url(stringifiedHeader);

                const stringifiedData = CryptoJS.enc.Utf8.parse(JSON.stringify(data));
                const encodedData = base64url(stringifiedData);

                let signature = `${encodedHeader}.${encodedData}`;
                signature = CryptoJS.HmacSHA256(signature, secret);
                signature = base64url(signature);

                return `${encodedHeader}.${encodedData}.${signature}`;
            }).catch(error => error);
    }
}

function randomGen(arr) {
    const pos = Math.floor(Math.random() * arr.length);
    const tempEle = arr[pos];

    arr = arr.filter(item => item !== tempEle);

    if (arr.length === 0) return tempEle;

    return tempEle + randomGen(arr);
}

class PasswordGenService {
    /**
     * generates a random String depending on the query params
     * @param query (length<Integer> | readable<Boolean>)
     * @returns {Promise.<TResult>}
     */
    find({ query, payload }) {
        if (query.readable) {
            const p2 = new Promise((resolve, reject) => {
                const arr = [chance.first(), chance.last(), chance.character({ symbols: true }), chance.natural({ min: 0, max: 9999 })];

                resolve(randomGen(arr));
            });

            return p2.then(res => res);
        }

        const length = (query.length) ? query.length : 255;
        const minLength = (query.length) ? query.length : 8;

        const p1 = new Promise((resolve, reject) => {
            resolve(new RandExp(`^(?=.*[A-Z])(?=.*[0-9])(?=.*[a-z])(?=.*[\-_!<>§$%&\/()=?\\;:,.#+*~']).{${minLength},${length}}$`).gen());
        });

        return p1.then(res => res);
    }
}

module.exports = function () {
    const app = this;

    const options = {
        Model: account,
        paginate: false,
        lean: true,
    };

    // Initialize our service with any options it requires

    app.use('/accounts/pwgen', new PasswordGenService());

    app.use('/accounts', service(options));

    app.use('/accounts/jwt', new CustomJWTService(app.get('secrets').authentication));


    app.use('/accounts/confirm', {
        create(data, params) {
            return account.update({ _id: data.accountId }, { $set: { activated: true } });
        },
    });

    // Get our initialize service to that we can bind hooks
    const customJWTService = app.service('/accounts/jwt');
    const accountService = app.service('/accounts');

    customJWTService.hooks(hooksCJWT);
    accountService.hooks(hooks);
};
