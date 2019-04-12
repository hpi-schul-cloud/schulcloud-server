'use strict';

const feathers = require('@feathersjs/feathers');
const express = require('express');
const errors = require('@feathersjs/errors');
const path = require("path");
const auth = require('@feathersjs/authentication');

module.exports = function () {
    const app = this;
    app.use('/clipboard/uploads', 
        auth.express.authenticate('jwt', {exposeCookies: true, exposeHeaders: true})
    );
    app.use('/clipboard/uploads', feathers.static(path.join(__dirname, '/../../../uploads')));
};


