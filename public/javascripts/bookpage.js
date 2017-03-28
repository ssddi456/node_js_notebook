require([
  './lib/model',
  './note',
  'ko',
  './lib/editor'
],function(
  model,
  note,
  ko,
  editor
){
  
  // 
  // 这将成为一个notebook的内容页
  // 新的notebook 每一个book内部是一个上下文有关的执行序列
  // 每一块均可以访问一个持久化了的 _context 对象进行数据存取
  // 每一块执行完成之后，输出执行结果( stdin & stdout )
  // 
  // 每一块的类型可以是文本或者代码，文本类型不可执行，直接展示
  // 代码类型可以执行，类型仅限js
  // 
  // 可以选择导出为html
  // 工具条统一显示在头部，对于每一个块而言不单独保存工具条。
  // 工具条的操作关联到当前块
  // 每一块可以折叠
  // 
  // 执行时，可选全部执行，或者从某一块开始执行，
  // 每一块执行完成后持久化该块对应的context，并作为下一块执行的参数
  // 
  // 其他的magic
  //    数据库连接？
  //    cookie管理？
  //
  // all
  //    exec_section
  //    
  // notebook
  //    _id
  //    name
  //    desc
  //    createAt
  //    
  //    add
  //    
  //    update 改改名字之类的
  //
  //    exec 执行所有内容
  //    executing
  //
  // note
  //    _id
  //    parent_id -> notebook._id
  //    type : javascript | typescript | text
  //    code : string,
  //    order : number 不可以为稀疏的
  //
  //    visible :
  //
  //    context :
  //
  //    add
  //    insert
  //    delete
  //    move
  //
  //    edit
  //    exec
  //    

  var model_notebookset = model({
  });

  var notebookset = function() {
      model_notebookset.create.call(this, arguments[0]);
  };
  notebookset.prototype = {
    constructor : notebookset,
    exec_section : function( code, done ) {
        
    },
    add_notebook : function( done ) {
      // 这里添加notebook
    },
    load_books : function( done ) {
      // 加载所有的book
      done(null, [{
        id : 'test_id',
        name : 'notebook1',
        desc : '测试',
        executing : false
      }])
    }
  };

  var model_notebook = model({
      name : '',
      desc : '',
      createAt : {
        readonly : true,
        initial : 0,
      },
      executing : {
        readonly : true,
        initial : 0
      },
  });

  var notebook = function() {
      model_notebook.create.call(this, arguments[0]);
  };
  notebook.prototype = {
    constructor : notebook,
    update : function() {
        // 更新数据
    },
    add_note : function() {
        // 添加note
    },
    insert : function( node_before, done ) {
        // 
    },
    move : function( node, node_before ) {
        // 
    },
    exec : function() {
        // 
    },
    load_notes: function( done ) {
        //
    }
  };

  var model_note = model({
      parent_id : '',
      type      : '',
      code      : '',
      order     : '',
      visible   : 0,
      context   : {},
  });
  model_note.prototype = {
    constructor : model_note,
    'delete' : function() {
        
    },

    edit : function() {
        
    },
    exec : function() {
        
    }
  };


  var main_vm = {
    current_notebook : ko.observable(),
    current_note : ko.observable(),
    notebooks : ko.observableArray(),
  };

  ko.applyBindings(main_vm);

  model_notebookset.load_books(function( err, notebooks ) {
    if( !err ){

      notebooks.forEach(function( book ) {
          notebooks.push( model_notebook.create(book) );
      });
    }
  });


});