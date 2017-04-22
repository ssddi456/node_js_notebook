var debug = require('debug')('lib/slow_pull');


var map = {};

var uuid = require('./uuid');

module.exports = {
  wrapper :function( handle, res_mapper, timeout ) {
    timeout = timeout || 3e3;
    res_mapper = res_mapper || function( err, res ) {
        return {
                err : err,
                res : res
              };
    }

    return function(  ) {
        var self = this;

        var args = [].slice.call( arguments);
        var params = args.slice(0, -1);
        var o_done = args[args.length - 1];

        var pull_id = uuid();
        var fast_end = setTimeout(function() {
            map[pull_id] = { pull_id : pull_id, err : 0 };
            o_done(null, map[pull_id]);

            fast_check = function(args) {
                debug('fast_check', args);
                map[pull_id] = res_mapper.apply(null, args);

                setTimeout(function() {
                    delete map[pull_id];
                }, 10e3);
            }
        }, timeout);

        var fast_check = function(args) {
          clearTimeout(fast_end);
          debug('fast_check', args);
          o_done.apply(self, args);
        };

        var fast_check_wrapper = function() {
          fast_check.apply(this, [[].slice.call(arguments)]);
        };

        handle.apply(this, params.concat(fast_check_wrapper));

    }

  },
  check : function( id ) {
    if( map.hasOwnProperty(id) ){
      return map[id];
    }
    return null;
  }
}