const globalHooks = require('../../hooks');
const errors = require('feathers-errors');

const createParent = (data, params, user, app) => {
    return app.service('/registrationPins/').find({query: { "pin": data.pin, "email": data.parent_email, verified: false }})
    .then(check => {
        if (!(check.data && check.data.length > 0 && check.data[0].pin === data.pin)) {
            return Promise.reject("Ungültige Pin, bitte überprüfe die Eingabe.");
        }
        let parentData = {
            firstName: data.parent_firstName,
            lastName: data.parent_lastName,
            email: data.parent_email,
            children: [user._Id],
            schoolId: user.schoolId,
            roles: ["parent"]
        };
        return app.service('users').create(parentData, { _additional:{asTask:'parent'} })
        .catch(err => {
            if (err.message.startsWith("parentCreatePatch")) {
                return Promise.resolve(err.data);
            } else {
                return Promise.reject(new Error("Fehler beim Erstellen des Elternaccounts."));
            }
        });
    });
};

const firstLogin = async function(data, params, app) {
    if(data["password-1"] !== data["password-2"]){
        return Promise.reject("Die neuen Passwörter stimmen nicht überein.");
    }

    let accountId = params.payload.accountId;
    let accountUpdate = {};
    let accountPromise = Promise.resolve();
    let userUpdate = {};
    let userPromise;
    let consentUpdate = {};
    let consentPromise = Promise.resolve();
    let user = await app.service('users').get(params.account.userId);  

    if (data.parent_email) {
        await createParent(data, params, user, app)
        .then(parent => {
            //toDo: keep old parents?
            userUpdate.parents = [parent._id];
        });
    }
    
    // wrong birthday object?
    if (data.studentBirthdate) {
        let dateArr = data.studentBirthdate.split(".");
        let userBirthday = new Date(`${dateArr[1]}.${dateArr[0]}.${dateArr[2]}`);
        if(userBirthday instanceof Date && isNaN(userBirthday)) {
            return Promise.reject("Bitte einen validen Geburtstag auswählen.");
        }
        userUpdate.birthday = userBirthday;
    }
    // malformed email?
    if (data["student-email"]) {
        var regex = RegExp("^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$");
        if (!regex.test(data["student-email"])) {
            return Promise.reject("Bitte eine valide E-Mail-Adresse eingeben.");
        } else {
            userUpdate.email = data["student-email"];
        }
    }
    
    let preferences = user.preferences || {};
    preferences.firstLogin = true;
    userUpdate.preferences = preferences;

    userPromise = app.service('users').patch(user._id, userUpdate);

    if (data.privacyConsent || data.thirdPartyConsent || data.termsOfUseConsent || data.researchConsent) {
        consentUpdate = {
            form: 'digital',
            privacyConsent: data.privacyConsent,
            thirdPartyConsent: data.thirdPartyConsent,
            termsOfUseConsent: data.termsOfUseConsent,
            researchConsent: data.researchConsent
        };
        if (data.parent_email) {
            consentUpdate.parentId = user.parents[0];
            consentPromise = app.service('consents').create({userId: user._id,parentConsents: [consentUpdate]});
        } else {
            consentPromise = app.service('consents').create({userId: user._id, userConsent: consentUpdate});
        }
    }

    if (data["password-1"]) {
        accountUpdate.password_verification = data.password_verification;
        accountUpdate.password = data["password-1"];
        accountPromise = app.service('accounts').patch(accountId, accountUpdate);
    }

    return Promise.all([accountPromise, userPromise, consentPromise])
        .then((result) => {
            return Promise.resolve(result);
        })
        .catch(err => {
            return Promise.reject(err);
        });
};

module.exports = function (app) {

	class firstLoginService {
		constructor() {

        }
        
		create(data, params) {
			return firstLogin(data, params, app);
		}
	}

	return firstLoginService;
};