define([

],function(

){
  
  var $loading = $('#loading');

  return function( url, data, callback ) {
    if( typeof data == 'function' ){
      callback = data;
      data = {};
    }


    var check_pull = function( pull_id ) {
      $loading.stop().fadeIn();

      $.post('/bookpage/slow_pull/' + pull_id, function( res ) {
        if( res.pull_id ){
          setTimeout(function() {
              check_pull(res.pull_id);
          }, 3e3);
        } else {
          $loading.stop().fadeOut();

          if( res.err == 0 ){
            callback(res);
          }
        }
      });
    };

    $.post(url, data, function( res ) {
      if( res.pull_id ){
        check_pull(res.pull_id)
      } else {
        callback(res);
      }
    });
  }
});