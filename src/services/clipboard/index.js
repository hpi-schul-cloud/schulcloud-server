'use strict';

const feathers = require('feathers');
const express = require('express');
const errors = require('feathers-errors');
const path = require("path");
const auth = require('feathers-authentication');

module.exports = function () {
    const app = this;
    app.use('/clipboard/uploads', 
        auth.express.authenticate('jwt', {exposeCookies: true, exposeHeaders: true})
    );
    app.use('/clipboard/uploads', feathers.static(path.join(__dirname, '/../../../uploads')));
};


