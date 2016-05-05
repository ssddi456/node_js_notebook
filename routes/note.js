var path = require('path');
var express = require('express');
var util = require('util');
var fs = require('fs');
var router = express.Router();

var debug = require('debug')('router/notes');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});



var storage = require('../lib/storage');
var uuid = require('../lib/uuid');

router.post('/add',function( req, res, next ) {
  storage.add(function(err, note) {
    if(err){
      next(err);
    } else {
      res.json(note);
    }
  });
});

router.post('*',function( req, resp, next ) {
  var id = req.body.id;
  storage.get( id, function(err, res ) {
    if( err )    {
      next(err);
      return;
    }

    if( res ){
      resp.locals.note = res;
      next();
      return;
    }

    resp.json({
      error : 1,
      message : 'note not found'
    });
  });
});

router.post('/remove',function( req, res, next ) {
  storage.remove(req.body.id, function(err) {
    if( !err ){
      res.json({
        error : 0
      });
    } else {
      res.json({
        error : 1,
        message: 'remove failed'
      });
    }
  });
});

router.post('/save',function( req, res, next ) {
  var note = {};

  for(var k in req.body){
    if( k != 'id' && req.body.hasOwnProperty(k) ){
      note[k] = req.body[k];
    }
  }

  storage.update(req.body.id, note, function(err) {
    if( err ){
      res.json({
        error : 1,
        message : err
      });
    } else {
      res.json({
        error : 0
      });
    }
  });
});


var bootstrap = '';
storage.get_bootstrap(function(err, node ) {
  if( err ){
    debug('get bootstrap code failed', err );
    return;
  }
  bootstrap = decodeURIComponent(node.code);
});

router.post('/save_bootstrap', function( req, res, done ) {
  var code = req.body.code;
  if( !code ){
    return done(new Error('code note given'));
  }
  storage.update_bootstrap( code, function(err) {
    if( err ){ return done(err); }
    bootstrap = decodeURIComponent(req.body.code);
    debug('code changed!');

    res.json({ error : 0 });
  });
});

var child_process = require('child_process');
var code_cache_path = path.join(__dirname,'../data/code_cache');

function process_mac (code) {
  var records = 0;
  return  code.replace(/(?:\n)\s*note_exec\s*\((.*)\)/g, function($, $code ) {
            return '\nconsole.log(\''  + (++records) + ' : ' + $code.replace(/(['"])/g,'\\\\$1') + '\');\n'
                  +'console.log('+ $code +');\n';
          })
          .replace(/(?:\n)\s*mongo_exec\s*\((.*)\)/g, function($, $code ) {
            return '\nprint(\'---- '  + (++records) + ' : ' + $code.replace(/(['"])/g,'\\\\$1') + ' ----\');\n'
                  + 'printjson('+ $code +');\n'
                  + 'print(\'---- '  + (records) + ' end  ----\');\n';
          });
}


function generate_temp_file( code ) {
  var tmp_file_name = path.join(code_cache_path, uuid() + '.js');
  code = bootstrap + '\n' + code;
  fs.writeFileSync(tmp_file_name, code);
  return tmp_file_name;
    
}
function run_as_node ( file ) {
  return child_process.fork(file, { silent : true});
}

function run_as_mongo ( file ) {
  return child_process.spawn('d:/Program Files/MongoDB/Server/3.2/bin/mongo.exe', [file]);
}

function exec_code ( code, done ) {
  try{
    code = process_mac(code);

    var tmp_file_name = generate_temp_file(code);

    var cp = run_as_node(tmp_file_name);
  } catch(e){
    return done(e);
  }

  var stdout = [];
  var stderr = [];
  var exceptions = [];
  var exports = [];

  var out = {};

  cp.stdout.on('data',function( chunk ) {
    stdout.push(chunk);
  });

  cp.stderr.on('data',function( chunk ) {
    stderr.push(chunk);
  });

  cp.on('error',function( e ) {
    exceptions.push(e);
  });

  cp.on('exit',function( code ) {
    out.stdout = Buffer.concat(stdout).toString();
    out.stderr = Buffer.concat(stderr).toString();
    out.exceptions = exceptions;
    out.code = code;
    fs.unlink(tmp_file_name);
    done(null, out);
  });
}

router.post('/exec',function( req, res, next ) {
  var note_id = req.body.id;

  storage.get(note_id, function( err, note ) {
    exec_code( 
      decodeURIComponent(note.code), 
      function( e, _res ) {
        if(e){
          res.json({
            error : 1,
            msg   : 'exec perpare failed',
            message : e.message + '\n' + e.stack
          });
        } else {
          var note = { res : _res };
          storage.update(note_id, note, function(err) {
            if( !err ){
              res.json({
                error : 0,
                res : _res
              });
            } else{
              res.json({
                error : 1,
                message:'res save failed',
                res : _res
              });
            }
          });
        }
      });
  });
});

module.exports = router;
