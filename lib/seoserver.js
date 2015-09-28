var express = require('express'),
    app = express(),
    args = process.argv.splice(2),
    port = args[0] !== 'undefined' ? args[0] : 3000,
    protocol = args[1] !== 'undefined' ? args[1] : 'http',
    config = require('../bin/config'),
    getContent,
    respond,
    cheerio = require('cheerio'),
    Entities = require('html-entities').AllHtmlEntities;

getContent = function(url, callback) {
    var content = '',
        phantom = require('child_process').spawn('phantomjs', ['--ignore-ssl-errors=true', '--output-encoding=utf8', __dirname + '/phantom-server.js', url]);
    phantom.stdout.setEncoding('utf8');
    phantom.stdout.on('data', function(data) {
        content += data.toString();
    });
    phantom.stderr.on('data', function(data) {
        if (config.verbose) {
            console.log('url: ' + url + ' stderr: ' + data);
        }
    });
    phantom.on('exit', function(code) {
        if (code !== 0) {
            if (config.verbose) {
                console.log('url: ' + url + ' ERROR: PhantomJS Exited with code: ' + code);
            }
        } else {
            if (config.verbose) {
                console.log(
                    'url: ' + url +
                    ' HTMLSnapshot completed successfully.' +
                    ' Content-Length: ' + content.length
                );
            }
            var entities = new Entities();
            var clean = cheerio.load(content);
            clean('script').remove();
            callback(clean.html().replace(/(&#x.*?;)|(&amp;)/g, function(match) {
                return entities.decode(match);
            }));
        }
    });
};

respond = function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    var url;
    if (req.headers.referer) {
        url = req.headers.referer;
    } else {
        var host = req.headers['x-forwarded-host'] || req.headers['host'].split(':')[0];
        if (host) url = protocol + '://' + host + '/';
        if (url) {
            if (req.query['_escaped_fragment_'] || req.query.hasOwnProperty('_escaped_fragment_')) {
                if (req.query['_escaped_fragment_'].length > 1) {
                    url = url + '#!' + req.query['_escaped_fragment_'];
                }
            } else if (req.params && req.params.length && req.params[0].length > 1) {
                if (req.params[0].indexOf('favicon') != -1) return;
                url = url + '#!' + req.params[0].substring(1);
            }
        }
    }


    console.log('url:', url);
    getContent(url, function(content) {
        res.send(content);
    });
};

app.get(/(.*)/, respond);
app.listen(port);
