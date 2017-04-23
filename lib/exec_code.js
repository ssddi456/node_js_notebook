var path    = require('path');
var debug_name = path.basename(__filename,'.js');
if( debug_name == 'index'){
  debug_name = path.basename(__dirname);
}
(require.main === module) && (function(){
    process.env.DEBUG = '*';
})()
var debug = require('debug')(debug_name);

var child_process = require('child_process');
var code_cache_path = path.join(__dirname,'../data/code_cache');
var uuid = require('../lib/uuid');
var fs = require('fs');

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
  fs.writeFileSync(tmp_file_name, code);
  return tmp_file_name;
}
function run_as_node ( file ) {
  var env = Object.create(process.env);
  env.DEBUG = null;
  return child_process.spawn( process.execPath, [file], { env : env });
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
    console.log( chunk.toString() );
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

module.exports = exec_code;