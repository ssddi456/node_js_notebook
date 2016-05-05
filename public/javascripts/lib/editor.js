define([
  'ko'
],function(
  ko
){
  var langTools = ace.require("ace/ext/language_tools");
  var tangideCompleter = {  
    getCompletions: function(editor, session, pos, prefix, callback) {
      console.log( editor.getValue() );
      console.log( arguments );
      if (prefix.length === 0) {
        return callback(null, []);    
      } else {
        return callback(null, []);    
      } 
    }
  };
  langTools.addCompleter(tangideCompleter);

  ko.bindingHandlers.editor = {
    'init' : function(element, valueAccessor, allBindings, viewModel, bindingContext) {

      $(element).on('keyup keydown mousewheel',function( e ){
        e.stopPropagation();
      });

      setTimeout(function() {
        var editor = ace.edit(element);

        editor.setValue(viewModel.code());
        editor.clearSelection();

        // throtll sync editor content to vm;      
        var change = ko.observable();
        editor.on("change", change.extend({ rateLimit: 500 }));

        change.subscribe(function() {
          console.log( 'writed');
          viewModel.code( editor.getValue() );
        });

        editor.setTheme("ace/theme/monokai");
        editor.getSession().setMode("ace/mode/javascript");

        editor.setOptions({
          enableBasicAutocompletion: true, 
          enableSnippets: true, 
          enableLiveAutocompletion: true
        });
      });


      //{ 
      //  "meta":"function", 
      //  "caption":"addShape", 
      //  "value":"addShape",
      //  "score":1
      // }
    }
  }
});