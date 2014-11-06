/*!
 * @overview  Ember-React
 * @copyright Copyright 2014 Gordon L. Hempton and contributors
 * @license   Licensed under ISC license
 *            See https://raw.github.com/ghempton/ember-react/master/LICENSE
 * @version   0.0.2
 */
(function() {
var define, requireModule, require, requirejs;

(function() {
  var registry = {}, seen = {}, state = {};
  var FAILED = false;

  define = function(name, deps, callback) {
    registry[name] = {
      deps: deps,
      callback: callback
    };
  };

  function reify(deps, name, seen) {
    var length = deps.length;
    var reified = new Array(length);
    var dep;
    var exports;

    for (var i = 0, l = length; i < l; i++) {
      dep = deps[i];
      if (dep === 'exports') {
        exports = reified[i] = seen;
      } else {
        reified[i] = require(resolve(dep, name));
      }
    }

    return {
      deps: reified,
      exports: exports
    };
  }

  requirejs = require = requireModule = function(name) {
    if (state[name] !== FAILED &&
        seen.hasOwnProperty(name)) {
      return seen[name];
    }

    if (!registry[name]) {
      throw new Error('Could not find module ' + name);
    }

    var mod = registry[name];
    var reified;
    var module;
    var loaded = false;

    seen[name] = { }; // placeholder for run-time cycles

    try {
      reified = reify(mod.deps, name, seen[name]);
      module = mod.callback.apply(this, reified.deps);
      loaded = true;
    } finally {
      if (!loaded) {
        state[name] = FAILED;
      }
    }

    return reified.exports ? seen[name] : (seen[name] = module);
  };

  function resolve(child, name) {
    if (child.charAt(0) !== '.') { return child; }

    var parts = child.split('/');
    var nameParts = name.split('/');
    var parentBase;

    if (nameParts.length === 1) {
      parentBase = nameParts;
    } else {
      parentBase = nameParts.slice(0, -1);
    }

    for (var i = 0, l = parts.length; i < l; i++) {
      var part = parts[i];

      if (part === '..') { parentBase.pop(); }
      else if (part === '.') { continue; }
      else { parentBase.push(part); }
    }

    return parentBase.join('/');
  }

  requirejs.entries = requirejs._eak_seen = registry;
  requirejs.clear = function(){
    requirejs.entries = requirejs._eak_seen = registry = {};
    seen = state = {};
  };
})();

define("ember-react/component", ["exports"], function(__exports__) {
  "use strict";

  function __es6_export__(name, value) {
    __exports__[name] = value;
  }

  var get = Ember.get;
  /**
    Renders a React component with the passed in options hash
    set as props.
    
    Usage:
    
    ```handlebars
      {{react 'my-component' value=value onChange=valueChanged}}
    ```
  */
  var ReactComponent = Ember.Component.extend({
    
    name: null,
    _props: null,
    _reactComponent: null,
    
    reactClass: Ember.computed(function() {
      var container = get(this, 'container'),
          name = get(this, 'name');
          
      return container.lookupFactory('react:' + name);
    }).property('name'),
    
    buildReactContext: function() {
      var container = get(this, 'container'),
          controller = get(this, 'controller');
      
      return {
        container: container,
        controller: controller
      };
    },
    
    renderReact: function() {
      var el = get(this, 'element'),
          reactClass = get(this, 'reactClass'),
          controller = get(this, 'controller'),
          context = this.buildReactContext();
      
      var props = this._props;
      props.model = props.model || get(controller, 'model');
      
      var descriptor = React.withContext(context, function() {
        if(React.isValidClass(reactClass)) {
          return reactClass(this._props);
        } else if(React.isValidComponent(reactClass)) {
          return reactClass;
        } else {
          throw new Ember.Error("Invalid react component or class");
        }
      }.bind(this));
      
      this._reactComponent = React.renderComponent(descriptor, el);
    },
    
    didInsertElement: function() {
      this.renderReact();
    },
    
    willDestroyElement: function() {
      var el = get(this, 'element');
      React.unmountComponentAtNode(el);
    },
    
    unknownProperty: function(key) {
      return this._props[key];
    },
    
    setUnknownProperty: function(key, value) {
      var reactComponent = this._reactComponent;
      if(!this._props) {
        this._props = {};
      }
      this._props[key] = value;
      if(reactComponent) {
        var props = {};
        props[key] = value;
        reactComponent.setProps(props);
      }
      return value;
    }
    
  });

  __es6_export__("default", ReactComponent);
});

//# sourceMappingURL=component.js.map
define("ember-react/ember-link", ["exports"], function(__exports__) {
  "use strict";

  function __es6_export__(name, value) {
    __exports__[name] = value;
  }

  __es6_export__("default", React.createClass({
    displayName: 'EmberLink',
    contextTypes: {
      container: React.PropTypes.object
    },
    propTypes: {
      to: React.PropTypes.string.isRequired,
      context: React.PropTypes.oneOfType([
        React.PropTypes.string,
        React.PropTypes.object
      ]),
      query: React.PropTypes.object
    },
    getRouterArgs: function() {
      var args, context;
      args = [this.props.to];
      context = this.props.context || this.props.params;
      if (context) {
        if (Array.isArray(context)) {
          args = args.concat(context);
        } else {
          args.push(context);
        }
      }
      if (this.props.query) {
        args.push({
          query: this.props.query
        });
      }
      return args;
    },
    getHref: function() {
      var router;
      router = this.context.container.lookup('router:main');
      return router.generate.apply(router, this.getRouterArgs());
    },
    handleClick: function(e) {
      var router;
      if (!e.defaultPrevented && !(e.button === 1 || e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        router = this.context.container.lookup('router:main');
        return router.transitionTo.apply(router, this.getRouterArgs());
      }
    },
    render: function() {
      return React.DOM.a({href: this.getHref(), onClick: this.handleClick}, this.props.children) 
    }
  }));
});

//# sourceMappingURL=ember-link.js.map
define(
  "ember-react/ext/route",
  ["../component", "exports"],
  function(ember$react$component$$, __exports__) {
    "use strict";

    function __es6_export__(name, value) {
      __exports__[name] = value;
    }

    var ReactComponent;
    ReactComponent = ember$react$component$$["default"];


    Ember.Route.reopen({
      
      render: function(name, options) {
        if (typeof name === 'object' && !options) {
          options = name;
          name = this.routeName;
        }
        if(options && options.react) {
          var container = this.container,
              containerName = 'view:' + name;
              
          name = name || this.routeName;
          
          if(!container.has(containerName)) {
            var View = ReactComponent.extend({
              reactClass: options.react,
              rootPath: this.router.generate(this.routeName)
            });
            this.container.register(containerName, View);
          }
        }
        this._super.apply(this, arguments);
      }
      
    });
  }
);

//# sourceMappingURL=route.js.map
define(
  "ember-react/helper",
  ["./component", "exports"],
  function(ember$react$component$$, __exports__) {
    "use strict";

    function __es6_export__(name, value) {
      __exports__[name] = value;
    }

    var ReactComponent;
    ReactComponent = ember$react$component$$["default"];

    var EmberHandlebars = Ember.Handlebars;

    var helper = function(name, options) {
      var hash = options.hash;
      hash.name = name;
      return EmberHandlebars.helpers.view.call(this, ReactComponent, options);
    };

    __es6_export__("default", helper);
  }
);

//# sourceMappingURL=helper.js.map
define(
  "ember-react/index",
  ["./ember-link", "./component", "./helper", "./initializer", "./ext/route", "exports"],
  function(
    ember$react$ember$link$$,
    ember$react$component$$,
    ember$react$helper$$,
    ember$react$initializer$$,
    ember$react$ext$route$$,
    __exports__) {
    "use strict";

    function __es6_export__(name, value) {
      __exports__[name] = value;
    }

    var EmberLink;
    EmberLink = ember$react$ember$link$$["default"];
    var ReactComponent;
    ReactComponent = ember$react$component$$["default"];
    var ReactHelper;
    ReactHelper = ember$react$helper$$["default"];
    var initializer;
    initializer = ember$react$initializer$$["default"];

    var EmberReact = {
      EmberLink: EmberLink,
      ReactComponent: ReactComponent,
      ReactHelper: ReactHelper,
      initializer: initializer
    };

    Ember.Application.initializer(initializer);

    __es6_export__("default", EmberReact);
  }
);

//# sourceMappingURL=index.js.map
define(
  "ember-react/initializer",
  ["./helper", "./component", "exports"],
  function(ember$react$helper$$, ember$react$component$$, __exports__) {
    "use strict";

    function __es6_export__(name, value) {
      __exports__[name] = value;
    }

    var ReactHelper;
    ReactHelper = ember$react$helper$$["default"];
    var ReactComponent;
    ReactComponent = ember$react$component$$["default"];

    __es6_export__("default", {
      name: "ember-react",
      
      initialize: function(container, application) {
        Ember.Handlebars.registerHelper('react', ReactHelper);
        //container.register('helper:react', ReactHelper);
        //container.register('component:react', ReactComponent);
        
        //TODO: better way to add this?   
        container.resolver.__resolver__.get('moduleNameLookupPatterns').push(function(parsedName) {
          if(parsedName.type === 'react') {
            return application.modulePrefix + '/react/' + parsedName.fullNameWithoutType;
          }
        });
      }
    });
  }
);

//# sourceMappingURL=initializer.js.map
this.EmberReact = requireModule("ember-react/index")["default"];

})();