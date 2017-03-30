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
      var $element = $(element);

      var min_lines = 3;
      var max_lines = 20;
      var lineheight = 19;

      $element.on('keyup keydown mousewheel',function( e ){
        e.stopPropagation();
      });

      setTimeout(function() {

        function resize( content ) {
            var lines = (content.match(/\n/g)||'').length+1;
            if( content[content.length - 1] != '\n' ){
              lines += 1;
            }

            lines = Math.min( max_lines, Math.max(min_lines, lines));

            var height = lines * lineheight;
            $element.css('height', height);
            editor.resize();
        }

        var editor = ace.edit(element);
        var code = viewModel.code();

        editor.setValue( code );
        resize( code );
        editor.clearSelection();


        // throtll sync editor content to vm;      
        var change = ko.observable();
        editor.on("change", change.extend({ rateLimit: 500 }));
        editor.setOptions({
          fontSize: "16px"
        });

        change.subscribe(function() {
          var content = editor.getValue();
          
          resize(content);

          viewModel.code( editor.getValue() );
        });

        // TODO : should use different theme and highlights
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