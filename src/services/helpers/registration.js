

const registerStudent = function(data, params, app) {
    let pininput = data["email-pin"]; 
    let usermail = data["parent-email"] ? data["parent-email"] : data["student-email"];
    let parent = null;
    let user;

    let passwort = data["initial-password"];
    return app.service('registrationPins').find({
        query: { "pin": pininput, "email": usermail, verified:false }
    }).then(check => {
        //check pin
        if (!(check.data && check.data.length>0 && check.data[0].pin === pininput)) {
            return Promise.reject("Ungültige Pin, bitte überprüfe die Eingabe.");
        }
        if (data["parent-email"] && data["parent-email"] === data["student-email"]) {
            return Promise.reject("Bitte gib eine eigene E-Mail Adresse für dein Kind an.");
        }
        return Promise.resolve;
    }).then(function() {
        //create user
        user = {
            firstName: data["student-firstname"],
            lastName: data["student-secondname"],
            email: data["student-email"],
            gender: data["gender"],
            roles: ["student"],
            classId: data.classId,
            birthday: new Date(data["student-birthdate"]),
            parentEmail: data["parent-email"]//used to verify that pin was has been confirmed
        };
        return app.service('users').create(user)
        .catch(err =>{
            return Promise.reject("Fehler beim Erstellen des Schülers. Eventuell ist die E-Mail-Adresse bereits im System registriert.");
        });
    }).then(newUser => {
        user = newUser;
        // create account
        account = {
            username: user.email, 
            password: passwort, 
            userId: user._id, 
            activated: true
        }
        return app.service('accounts').create(account);
    }).then(res => {
        //add parent if necessary    
        if(data["parent-email"]) {
            parent = {
                firstName: data["parent-firstname"],
                lastName: data["parent-secondname"],
                email: data["parent-email"],
                children: [user._id],
                schoolId: user.schoolId,
                roles: ["parent"]
            };
            return app.service('users').create(parent)
            .then(newParent => {
                parent = newParent;
                //add parent to student, because now, we can
                return Promise.resolve()
            }).catch(err => {
                if (err.error.message==="parentCreatePatch") {
                    return Promise.resolve();
                } else {
                    return Promise.reject(new Error("Fehler beim Erstellen des Elternaccounts."));
                }
            });
        } else {
            return Promise.resolve();
        }
    }).then(function(){
        //store consent
        let consent = {
            form: 'digital',
            privacyConsent: data.Erhebung,
            thirdPartyConsent: data.Pseudonymisierung,
            termsOfUseConsent: Boolean(data.Nutzungsbedingungen),
            researchConsent: data.Forschung
        };
        if (parent) {
            consent.parentId = parent._id;
            consentPromise = app.service('consents').create({userId: user._id,parentConsents: [consent]});
        } else {
            consentPromise = app.service('consents').create({userId: user._id, userConsent: consent});
        }
        consentPromise.catch(err => {
            return Promise.reject(err)
        })
        return consentPromise;
    }).then(function() {
        return Promise.resolve({user, parent});
    }).catch(err => {
        return Promise.reject((err.error||{}).message || err.message || "Fehler bei der Registrierung.");

        /*
        //If user for student created, remove that user, cannot do this bc no rights to do this
        let userpromise = api(req).get('/users/', {
            qs: {email: req.body["student-email"]}
        }).then(students => {
            return api(req).delete('/users/' + students._id);
        });

        //If account for student created, remove that account, cannot do this bc no rights to do this
        let accpromise = api(req).get('/accounts/', {
            qs: {email: req.body["student-email"]}
        }).then(students => {
            return api(req).delete('/accounts/' + students._id);
        });

        Promise.all([userpromise, accpromise]).then(()=>{*/
            
        /*}).catch(err => {
            res.status(500).send((err.error||{}).message || err.message || "Fehler bei der Registrierung.");
        });*/
    });
}

module.exports = function (app) {

	class RegistrationService {
		constructor() {

        }
        
		create(data, params) {
			return registerStudent(data, params, app);
		}
	}

	return RegistrationService;
};