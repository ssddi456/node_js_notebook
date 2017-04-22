var path = require('path');
var express = require('express');
var util = require('util');
var fs = require('fs');
var router = module.exports = express.Router();

var debug = require('debug')('router/notes');

var fs = require('fs');
var path = require('path');
var nedb = require('nedb');

var storage = new nedb({ 
                  filename : path.join(__dirname, '../data/notebook.db'),
                  autoload : true
                });

var model = require('../lib/model');
storage.persistence.setAutocompactionInterval(3*60*1e3);
var uuid = require('../lib/uuid');

var model_notebook = model({
  name : '',
  desc : '',
  createAt : {
    readonly : true,
    initial : 0
  },
  visible :{
    readonly : true,
    initial : 1
  }
});

var model_note = model({
  parent_id : {
    type : String,
    initial : ''
  },
  type : {
    type : String,
    initial : ''
  },
  code : {
    type : function( code ) {
        return encodeURIComponent(code);
    },
    initial : ''
  },
  order : {
    type : Number,
    initial : 0
  },
  visible : {
    type : Number,
    initial : 1
  },
  // 应该只有值类型
  context : {},
});

router.get('/', function(req, resp, next) {


  resp.render('bookpage', { 
    title: 'Node Note'
  });

});

/* GET users listing. */
router.get('/notebookset', function(req, resp, next) {
  storage.find({
    visible : 1,
    parent_id : { $exists : false }
  }, function( err, docs ) {
    if( !err ){
      resp.json({
        err : 0,
        notebooks: docs.map(model_notebook.wrap)
      });
    } else {
      next(err);
    }
  })
});


router.post('/notebook/add', function( req, resp, next ) {
  var query = req.query;
  var body = req.body;


  query = { _id : query.id };
  
  var doc = model_notebook.create(body);
  doc.createAt = Date.now();

  storage.insert( doc, function( err, doc ) {
     if( !err  ) {
        resp.json({
          err : 0,
          notebook : model_notebook.wrap(doc)
        });
      } else {
        next(err);
      }
  });
});

router.post('/notebook/:id', function( req, resp, next ) {
  var query = req.query;
  var body = req.body;
  var params = req.params;

  query = { _id : params.id };
  
  var notebook_doc = model_notebook.unwrap(body);
  storage.findOne( query, function( err, doc ) {
     if( !err && doc ) {
        storage.update(query, { $set : notebook_doc.doc }, function( err ) {
          if( !err ){
            resp.json({ 
              err : 0
            });
          } else {
            next(err);
          }
        });
      } else {
        next(err);
      }
  });
});


router.get('/notebook/:id/', function( req, resp, next ) {
  var query = req.query;
  var body = req.body;
  var params = req.params;

  if( !params.id ){
    throw new Error('illegal input');
  }

  query = { _id : params.id };

  storage.findOne( query, function( err, doc ) {

      if( !err && doc ) {
        storage.find({ parent_id : params.id }, function( err, docs ) {
          if( !err )  {
              resp.json({
                err : 0,
                notes : docs.map(model_note.wrap)
              });
          } else {
            next(err);
          }
        })
      } else {
        next(err);
      }

  });
});

router.post('/notebook/:id/delete', function( req, resp, next ) {
  var query = req.query;
  var body = req.body;
  var params = req.params;

  if( !params.id ){
    throw new Error('illegal input');
  }

  query = { _id : params.id };

  storage.findOne( query, function( err, doc ) {

      if( !err && doc ) {
        storage.update( 
          query,
          { visible : 0 }, 
          function( err, doc ) {
            if( !err )  {
              resp.json({
                err : 0,
                note : model_note.wrap(doc)
              });
            } else {
              next(err);
            }
          })
      } else {
        next(err);
      }

  });


});

router.post('/notebook/:id/add', function( req, resp, next ) {
  var query = req.query;
  var body = req.body;
  var params = req.params;

  if( !params.id ){
    throw new Error('illegal input');
  }

  query = { _id : params.id };

  storage.findOne( query, function( err, doc ) {

      if( !err && doc ) {
        storage.insert( 
          model_note.create({ 
            type : 'javascript',
            parent_id : params.id 
          }), 
          function( err, doc ) {
            if( !err )  {
              resp.json({
                err : 0,
                note : model_note.wrap(doc)
              });
            } else {
              next(err);
            }
          })
      } else {
        next(err);
      }

  });
});

router.post('/notebook/:id/note/:note_id/delete', function( req, resp, next ) {
  var query = req.query;
  var body = req.body;
  var params = req.params;

  if( !params.id || !params.note_id ){
    throw new Error('illegal input');
  }

  query = { 
    _id : params.note_id,
    parent_id : params.id
  };

  storage.remove(query, function(err) {
      if( err ){
        next(err);
      } else {
        resp.json({ err : 0});
      }
  });
});
router.post('/notebook/:id/note/:note_id', function( req, resp, next ) {
  var query = req.query;
  var body = req.body;
  var params = req.params;

  if( !params.id || !params.note_id ){
    throw new Error('illegal input');
  }

  query = { 
    _id : params.note_id,
    parent_id : params.id
  };

  var note_doc = model_note.unwrap(body);

  storage.findOne( query, function( err, doc ) {

      if( !err && doc ) {
        storage.update(query, { $set : note_doc.doc}, function( err ) {
          if( !err ){
            resp.json({ 
              err : 0
            });
          } else {
            next(err);
          }
        });
      } else {
        next(err);
      }

  });
});
router.get('/notebook/:id/export', function( req, resp, next ) {
  var query = req.query;
  var body = req.body;
  var params = req.params;

  query = { _id : params.id };

  storage.findOne( query, function( err, doc ) {
    if( !err && doc ) {
      storage.find({ parent_id : params.id }, function( err, docs ) {
        if( !err ){
          docs.sort(function( a, b ) {
              return a.order - b.order;
          }).forEach(function( note ) {
            resp.write( decodeURIComponent(note.code) );
            resp.write( '\n' );
          });
          resp.end('');
        } else {
          next(err);
        }
      });
    } else {
      next(err);
    }
  });

});

router.get('/notebook/:id/note/:note_id/export_context', function( req, resp, next ) {
  var query = req.query;
  var body = req.body;
  var params = req.params;

  query = { 
    _id : params.note_id,
    parent_id : params.id
  };

  storage.findOne( query, function( err, doc ) {
    if( !err && doc ) {
      resp.write( JSON.stringify((doc.context || {}).context) );
      resp.end('');
    } else {
      next(err);
    }
  });

});

var exec_queue = require('../lib/exec_queue');
var exec_with_context = exec_queue.do_exec;

var slow_pull = require('../lib/slow_pull');

// 
// 执行代码需要弄到一个队列里。
// 每一个笔记本一个队列（实际上可能就一个笔记本）
// 每个note一个子队列（似乎没有意义？）
// 
router.post('/notebook/:id/exec', function( req, resp, next ) {
  var query = req.query;
  var body = req.body;
  var params = req.params;

  query = { _id : params.id };

  // 这里需要依次执行这个notebooks里的所有任务
  storage.findOne( query, function( err, notebook_doc ) {
    if( !err && notebook_doc ) {
      var note_query = { parent_id : params.id };
      if( body.from ){
        note_query.order = { $gte : body.from };
      }

      storage.find(note_query, function( err, docs) {
        if( !err && docs.length ){
          
          slow_pull.wrapper(function( context, done ) {

            exec_queue.get_queue(params.id).push(context, done)

          }, function( err, reses ) {
              debug( 'format out', err, reses );
              return {
                err : err || 0,
                reses : reses || [],
              };

          })({
              storage : storage,
              notes : docs
            },
            function( err, reses ) {
              if( err ){
                next(err);
              } else {
                if( reses.pull_id ){
                  resp.json(reses);
                } else {
                  resp.json({
                    err : 0,
                    reses : reses
                  });
                }
              }
            });

        } else {
          next(err || new Error('notebook dont have a note'));
        }
      });


    } else {
      next( err || new Error('notebook didnt exists.') );
    }
  });

});


router.post('/notebook/:id/note/:note_id/exec', function( req, resp, next ) {
  var query = req.query;
  var body = req.body;
  var params = req.params;

  query = { 
    _id : params.note_id,
    parent_id : params.id
  };

  storage.findOne( query, function( err, note_doc ) {
    if( !err && note_doc ) {
      var exec_a_note = slow_pull.wrapper(function( context, done ) {
        exec_with_context(note_doc.code, context, function( err, res ) {
            if( err ){
              done(err);
            } else {
              done(err, res);

              storage.update(
                { _id : note_doc._id }, 
                { $set : { context : res.context } }, 
                { upsert : true },
                function(err, res) {
                  debug('note context updates');
                });
            }
        })
      });

      if( note_doc.order == 0 ){
        return do_exec();
      } 

      storage.findOne({
        parent_id : params.id,
        order : note_doc.order - 1
      }, function( err, prev_note ) {
        if( !err && prev_note ) {
          debug('prev_note', prev_note);
          do_exec(prev_note.context);
        } else {
          next(err || new Error('prev note not found'));
        }
      });



      function do_exec( context ) {
        exec_a_note(context, function( err, res ) {
            if( err ){
              next(err);
            } else {
              if( res.pull_id ){
                resp.json(res);
              } else {
                resp.json({
                   err : 0,
                   res : res.res,
                   context : res.context
                });
              }
            }
        });
      };

    } else {
      next();
    }
  });

});

router.post('/slow_pull/:id', function( req, resp, next ) {
  var query = req.query;
  var body = req.body;
  var params = req.params;

  if( !params.id ){
    throw new Error('illegal input');
  }
  var res = slow_pull.check(params.id);
  if( res ){
    resp.json(res);
  } else {
    next(new Error('async task not found'));
  }
})

