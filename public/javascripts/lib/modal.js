define([

],function(

){
  var ret = {};
  function modal( id ) {
    
    var $el = $(id);
    var $body = $el.find('.modal-body');
    var $edits = $body.find('input,textarea');

    function get_data () {

      var ret = {};

      $edits.each(function() {
          var $self = $(this);
          ret[ $self.attr('name') ] = $self.val();
      });

      return ret;

    }

    function set_data ( optn ) {

      $edits.each(function() {
          var $self = $(this);
          var attr = $self.attr('name');
          var initial = (typeof optn[ attr ] == 'function' ? optn[ attr ]() : optn[ attr ]) || '';

          $self.val(initial);
      });
        
    }

    var last_callback;
    var last_optns;

    function close () {
      $el.stop().fadeOut();
      last_callback = null;
      last_optns = null;
    }

    function confirm () {
      var data = get_data();
      var k;

      if( last_optns.data ){
        for(k in data){
          if( data.hasOwnProperty(k) ){
            if( typeof last_optns.data[k] == 'function' ){
              last_optns.data[k](data[k]);
            } else {
              last_optns.data[k] = data[k];
            }
          }
        }
      }

      last_callback && last_callback( null, data);

      close();
    }

    function show ( optn, callback ) {
      if( optn.data ){
        set_data(optn.data);
      }

      last_callback = callback;
      last_optns = optn;

      $el.stop().fadeIn();
    }

    $el.on('click', '[data-dismiss="modal"]', close);
    $el.on('click', '[data-label="confirm"]', confirm);

    return show;
  };

  ret.modal = modal;

  ret.notebook_edit = modal('#notebook_edit');
  

  return ret;
});
