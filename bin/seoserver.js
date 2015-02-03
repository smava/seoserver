#!/usr/bin/env node

var program = require('commander'),
    fs = require('fs'),
    forever = require('forever-monitor'),
    config = require('./config'),
    child;

// require our seoserver npm package

program
    .version('0.0.1')
    .option('-p, --port <location>', 'Specifiy a port to run on')
    .option('--protocol <location>', 'Specify protocol');

program
    .command('start')
    .description('Starts up an SeoServer on default port 3000')
    .action(function() {
        child = new (forever.Monitor)(__dirname + '/../lib/seoserver.js', {
            options: [program.port, program.protocol]
        });
        child.start();
        console.log(__dirname, 'SeoServer successfully started');
        console.log('With config: ', JSON.stringify(config, null, 4));
    });

program.command('kill')
    .description('kills process')
    .action(function() {
        child.kill();
    });

program.parse(process.argv);
