'use strict';

var mongoose = require( 'mongoose' );
var config = require( './index.js' );
process.env.server_port;
var mongoURI = process.env.MONGOLAB_URI || config.mongoURI;
console.log("mongo URI :" + mongoURI);
mongoose.connect( mongoURI );
