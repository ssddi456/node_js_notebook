var path = require('path');
var express = require('express');
var util = require('util');
var fs = require('fs');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});



var storage = require('../lib/storage');
var uuid = require('../lib/uuid');

router.post('/add',function( req, res, next ) {
  var note;
  var retry = 3;
  function create () {
    var uid = uuid();
    return storage.add(uid);
  }
  
  while(!(note = create()) && retry){ retry-- };

  var result= {
    error : (retry != 0 && note) ? 0 : 1,
  };

  util._extend(result, note);
  res.json(result);
});

router.post('*',function( req, res, next ) {
  var id = req.body.id;
  if( storage.get(id) ){
    next();
  } else {
    res.json({
      error : 1,
      message : 'note not found'
    });
  }
});

router.post('/remove',function( req, res, next ) {
  if(storage.remove(req.body.id)){
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

router.post('/save',function( req, res, next ) {
  var note = storage.get(req.body.id);
  util._extend(note,req.body);

  if(storage.update(req.body.id,note)){
    res.json({
      error : 0
    });
  } else {
    res.json({
      error : 1,
      message : 'update failed'
    });
  }
});


var child_process = require('child_process');
var code_cache_path = path.join(__dirname,'../data/code_cache');

function exec_code ( code, done ) {
  try{

    var tmp_file_name = path.join(code_cache_path, uuid() + '.js');
    fs.writeFileSync(tmp_file_name, code);
    var cp = child_process.fork(tmp_file_name,{ silent : true});
  } catch(e){
    return done(e);
  }

  var stdout = [];
  var stderr = [];
  var exceptions = [];
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
    fs.unlinkSync(tmp_file_name);
    done(null, out);
  });
}

router.post('/exec',function( req, res, next ) {
  var note_id = req.body.id;
  var note = storage.get(note_id);
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
        note.res = _res;
        if( storage.update(note_id, note) ){
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
      }
    });
});

module.exports = router;
