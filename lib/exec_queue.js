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
  code = decodeURIComponent(code)

  var requires = code.match(/^var (\w|_)+ = require.*/gm);
  debug( 'requires', context );

  var _code = '\nvar context = ' + JSON.stringify(context.context || {}) + ';\n';
  _code += (context.requires || []).join('\n');
  _code += code;
  _code += '\n; process.___end = false;\n';
  _code += 'process.on("beforeExit", function(){\n'; 
  _code += '  if(!process.___end){\n';
  _code += '    process.___end = true;\n';
  _code += '    console.log("\\n' + spliter +'" + JSON.stringify(context));\n'
  _code += '  }\n';
  _code += '})';

  return { 
    code : _code,
    requires : requires,
    spliter : spliter
  };
}

function do_exec( code, parent_context, done ) {
  parent_context = parent_context || {};

  code = format_code(code, parent_context);
  var spliter = code.spliter;

  debug('code', code);
  


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
          context : {
            requires : [].concat(parent_context.requires || []).concat(code.requires),
            context : context
          }
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

              task.storage.update(
                { _id : note._id }, 
                { $set : { context : res.context } }, 
                { upsert : true },
                function(err, res) {
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