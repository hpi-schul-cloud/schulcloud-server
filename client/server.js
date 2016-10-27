/*
var express = require('express');
var rewrite = require('express-urlrewrite')
var path = require('path');
var app = express();
var fs = require('fs');

const router = express.Router();



app.use(express.static(__dirname + '/public/'));

router.get('*', function(req, res) {
    res.sendFile(path.resolve(__dirname, '/public/index.html'));
});

app.use(router);

*/




const express = require('express')
const path = require('path')
const port = process.env.PORT || 3100
const app = express()

// serve static assets normally
app.use(express.static(__dirname + '/public'))

// handle every other route with index.html, which will contain
// a script tag to your application's JavaScript file(s).
app.get('*', function (request, response){
	response.sendFile(path.resolve(__dirname, 'public', 'index.html'))
})

app.listen(port)
console.log("server started on port " + port)
