const errors = require('feathers-errors');
const promisify = require('es6-promisify');
const logger = require('winston');
const lti = require('lti-consumer');
const LtiTool = require('./model');

module.exports = function(app) {
	const docs = {
		create: {
			parameters: [{
					description: 'the database id of the ltiTool',
					required: true,
					name: 'toolId',
					type: 'string'
				}],
			summary: 'Connects to the given ltiTool-provider via LTI ',
			notes: 'Returns a redirecting html or url'
		}
	};

    class LtiToolsService {
        constructor() {
            this.docs = docs;
        }
        // POST /ltitools/connect
        create({toolId, user_id, roles, lis_person_name_full}, params) {
            return LtiTool.findOne({'_id':toolId}).then((ltiTool) => {
                if(!ltiTool) throw new errors.NotFound(`no tool found for given toolId ${toolId}`);

                return makeLtiRequest(ltiTool, user_id);
            });
        }
    }

    function makeLtiRequest(ltiTool, user_id) {
        var consumer = lti.createConsumer(ltiTool.key, ltiTool.secret);
		// todo: get user data for userId

		var payload = {
			lti_version: ltiTool.lti_version,
			lti_message_type: ltiTool.lti_message_type,
			resource_link_id: ltiTool.resource_link_id,
			user_id: user_id || '1232342454523432443523425445',
			roles: 'Learner',
			launch_presentation_document_target: 'window',
			lis_person_name_full: 'John Logie Baird',
			lis_person_contact_email_primary: 'jbaird@uni.ac.uk',
			launch_presentation_locale: 'en'
		};

		var request_data = {
			url: ltiTool.url,
			method: 'POST',
			data: payload
		};

		return lti.sendRequest(request_data, consumer)
			.then((response) => {
			var keep = response;
			if (!keep.includes('<head>')) {
				// Fetches the url from given html response by regex
				let expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
				let regex = new RegExp(expression);
				keep = { data: keep.match(regex).toString(), type: 'url' };
			} else {
				keep = { data: keep, type: 'html'};
			}
			return Promise.resolve(keep);})
			.catch((error) => {
			var keep = error.message;
			if (!keep.includes('<head>')) {
				// Fetches the url from given html response by regex
				let expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
				let regex = new RegExp(expression);
				keep = { data: keep.match(regex).toString(), type: 'url' };
			} else {
				keep = { data: keep, type: 'html'};
			}
			return Promise.resolve(keep);
		});


		/**
        return consumer.withSession(function(session) {


            ltiTool.customs.forEach((custom) => {
               payload[LtiTool.customFieldToString(custom)] = custom.value;
            });

			console.log(payload);

            return session.basicLaunch(payload).
                then((response) => {
					var keep = response.getOrElse('');
					if (!keep.includes('<head>')) {
						// Fetches the url from given html response by regex
						let expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
						let regex = new RegExp(expression);
						keep = { data: keep.match(regex).toString(), type: 'url' };
					} else {
						keep = { data: keep, type: 'html'};
					}
                    return Promise.resolve(keep);
                }).catch((e) => {
                    return Promise.reject(e);
            });
        });**/
    }

    return LtiToolsService;
};
