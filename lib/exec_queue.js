var path    = require('path');
var debug_name = path.basename(__filename,'.js');
if( debug_name == 'index'){
  debug_name = path.basename(__dirname);
}
(require.main === module) && (function(){
    process.env.DEBUG = '*';
})()
var debug = require('debug')(debug_name);

var async = require('async');
var exec_code = require('./exec_code');

var exec_queues = {};

function format_code ( code, context ) {
  var spliter = '::context' + Date.now() + '--'+ Math.random() + '::';

  var _code = '\nvar context = ' + JSON.stringify(context) + ';\n';
  _code += decodeURIComponent(code);
  _code += '\n; console.log("\\n' + spliter +'" + JSON.stringify(context));\n';

  return { 
    code : _code,
    spliter : spliter
  };
}

function do_exec( code, context, done ) {
  context = context || {};


  debug('code', code);

  code = format_code(code, context);
  var spliter = code.spliter;

  debug('code', code.code);
  exec_code( code.code, function( err, res ) {
      if( err ){
        done(err);
      } else {
        var stdout = res.stdout;
        stdout = stdout.split('\n' + spliter);

        debug('stdout', stdout, res);

        res.stdout = stdout[0];
        var context = JSON.parse(stdout[1] || '{}');

        done(null, {
           res : res,
           context : context
        });

      }
  });
};

var exec_notebook = function( task, done ) {
    var reses = [];

    var notes = task.notes.sort(function( a, b ) {
        return a.order - b.order;
    }).map(function( note, idx ) {
        return function( context, done ){
          if( !done ){
            done = context;
            context = {};
          }

          do_exec( note.code, context, function(err, res) {
            
            if( err ){
              done(err);
            } else {
              reses[idx] = res;
              res.order = note.order;
              done(null, res.context);

              task.storage.update({ _id : note._id }, { $set : { context : res.context } }, function(err, res) {
                  debug('note context updates');
              });
            }

          });

        }
    });

    async.waterfall( notes, function( err ) {
        done(err, reses);
    });
}

module.exports = {
  get_queue : function( key ) {
    if( !exec_queues.hasOwnProperty(key) ){
      exec_queues[key] = async.queue(exec_notebook, 1);
    }
    return exec_queues[key];
  },
  do_exec : do_exec
}