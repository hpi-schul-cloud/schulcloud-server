/**
 * Created by carl on 21/10/2016.
 */
'use strict';

const moodleClient = require('moodle-client');

class Service {
    // POST /authentication/moodle
    create(data, params) {
        const options = {
            username: data.username,
            password: data.password,
            wwwroot: data.wwwroot,
            token: data.token
        };
        return moodleClient.init(options)
            .then((client) => {

            });
        /*if(Array.isArray(data)) {
            return Promise.all(data.map(current => this.create(current)));
        }*/

        //return Promise.resolve(data);
    }

    update(id, data, params) {
        return Promise.resolve(data);
    }

    patch(id, data, params) {
        return Promise.resolve(data);
    }

    remove(id, params) {
        return Promise.resolve({ id });
    }
}

module.exports = function(){
    const app = this;

    // Initialize our service with any options it requires
    app.use('/moodle', new Service());
};

module.exports.Service = Service;
