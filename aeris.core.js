/**
*
* @package Aeris JS Toolkit
* @version $Id: aeris.core.js 1097 2012-10-12 22:25:09Z nshipes $
* @copyright (c) 2012 HAMweather, LLC <http://www.hamweather.com>
* @license {LICENSE_URL} {LICENSE_TYPE}
*
*/

(function($){

	// reference to the global object
	var root = this;

	var Aeris = root.Aeris;
	if (!Aeris) {
		throw "AerisException";
	}

	// set underscore.js in noConflict within our own enclosure
	var _ = (root._) ? root._ : null;
	// if (!_ && (typeof require !== 'undefined')) _ = require(['underscore'], function(_, $) {
	//
	// });
	//Aeris._ = _.noConflict();
	//var $ = root.jQuery;
	Aeris._ = _;

	// Extend default config with passed in config options.
	// The third object are config options that should not be overriden.
	Aeris._.extend(Aeris.config, Aeris.userConfig, {
		base: (Aeris.secure) ? 'https://api.aerisapi.com/' : 'http://api.aerisapi.com/',
		batch: {
			maxRequests: 10
		}
	});

	Aeris.provide = function(ns) {
		var a = o = Aeris;
		var p = ns.split('.');
		for (var i = 1, len = p.length; i < len; i++) {
			var k = p[i];
			if (!o[k]) {
				o[k] = {};
			}
			o = o[k];
		}
	};


	//----------------
	// Aeris Endpoints
	//
	// An object mapping constants to what the API expects for the support endpoints.
	// Also allows us to validate a request to make sure a supported endpoint is being used.
	//----------------
	Aeris.endpoints = {
		BATCH		        : 'batch',
		PLACES		        : 'places',
		COUNTRIES	        : 'countries',
		OBS			        : 'observations',
		OBSRECENT	        : 'observations_recent',
		OBSARCHIVE	        : 'observations_archive',
		FORECASTS	        : 'forecasts',
		ADVISORIES	        : 'advisories',
		STMCELLS	        : 'stormcells',
		STMREPORTS	        : 'stormreports',
		FIRES		        : 'fires',
		LIGHTNING	        : 'lightning',
		EARTHQUAKES         : 'earthquakes',
		RECORDS             : 'records',
		SUNMOON             : 'sunmoon',
		MOONPHASES          : 'sunmoon_moonphases',
		NORMALS             : 'normals',
		NORMALSSTATIONS     : 'normals_stations',
		TIDES               : 'tides',
		TIDESSTATIONS       : 'tides_stations'
	};


	//--------------
	// Aeris Actions
	//--------------
	Aeris.actions = {
		ID		: '',
		CLOSEST	: 'closest',
		WITHIN	: 'within',
		SEARCH	: 'search'
	};

	Aeris.units = {
		METRIC		: 1,
		ENGLISH		: 0
	};

	Aeris.supportsEndpoint = function(endpoint) {
		var allow = false;
		for (var ep in Aeris.endpoints) {
			if (endpoint == Aeris.endpoints[ep]) {
				allow = true;
				break;
			}
		}
		return allow;
	};


	//-------------
	// Aeris Events
	//-------------

	/**
	* Event stuff barrowed from backbone.js as its implementation is better than what jQuery currently
	* offers.
	* http://documentcloud.github.com/backbone/
	*/
	Aeris.Events = {

		// Bind an event, specified by a string name to a callback function.
		// Passing "all" will bind the callback to all events fired.
		bind: function(events, callback, context) {
			var ev;
			events = events.split(/\s+/);
			var calls = this._callbacks || (this._callbacks = {});
			while (ev = events.shift()) {
				var list = calls[ev] || (calls[ev] = {});
				var tail = list.tail || (list.tail = list.next = {});
				tail.callback = callback;
				tail.context = context;
				list.tail = tail.next = {};
			}
			return this;
		},

		// Remove one or more callbacks.
		// If `context` is null, removes all callbacks with that function. If `callback` is null,
		// removes all callbacks for the event. If `event` is null, removes all bound callbacks for
		// all events.
		unbind: function(events, callback, context) {
			var ev, calls, node;
			if (!events) {
				delete this._callbacks;
			}
			else if (calls = this._callbacks) {
				events = events.split(/\s+/);
				while (ev = events.shift()) {
					node = calls[ev];
					delete calls[ev];
					if (!callback || !node) continue;
					// create a new list omitting the indicated event/context pairs
					while ((node = node.next) && node.next) {
						if (node.callback === callback && (!context || node.context === context)) continue;
						this.bind(ev, node.callback, node.context);
					}
				}
			}
			return this;
		},

		// Trigger an event, firing all bound callbacks.
		// Callbacks are passed the same arguments as `trigger` is, apart from the event name.
		trigger: function(events) {
			var event, node, calls, tail, args, all, rest;
			if (!(calls = this._callbacks)) return this;
			all = calls['all'];
			(events = events.split(/\s+/)).push(null);
			// save references to the current heads and tails
			while (event = events.shift()) {
				if (all) events.push({next:all.next, tail:all.tail, event:event});
				if (!(node = calls[event])) continue;
				events.push({next:node.next, tail:node.tail});
			}
			// traverse each list, stopping when the saved tail is reached
			rest = Array.prototype.slice.call(arguments, 1);
			while (node = events.pop()) {
				tail = node.tail;
				args = node.event ? [node.event].concat(rest) : rest;
				while ((node = node.next) !== tail) {
					node.callback.apply(node.context || this, args);
				}
			}
			return this;
		}

	};

	//------------
	// Aeris Model
	//------------

	// Create a new model with defined attributes. A unique id is automatically
	// generated and assigned to this model instance.
	Aeris.Model = function(attributes, options) {
		var defaults;
		attributes || (attributes = {});
		if (options && options.parse) attributes = this.parse(attributes);
		if (defaults) Aeris._.extend({}, defaults, attributes);
		// the collection this model belongs to, if any
		if (options && options.collection) this.collection = options.collection;

		this.attributes = attributes;
		this.cid = Aeris._.uniqueId('m');
		this._changed = false;
		this.initialize.apply(this, arguments);
	};

	Aeris._.extend(Aeris.Model.prototype, Aeris.Events, {
		_changed: false,

		// All model objects follow a certain spec in which certain attributes are required
		// We need to verify they are set when initializing
		initialize: function(spec) {},

		toJSON: function() {
			return Aeris._.clone(this.attributes);
		},

		get: function(attr) {
			return recompose(attr, this.attributes);
		},

		set: function(key, value, options) {

		},

		has: function(attr) {
			return this.attributes[attr] !== null;
		}
	});

	//-----------------
	// Aeris Collection
	//-----------------

	// Provides a standard collection class for our sets of models, ordered or
	// unordered.
	Aeris.Collection = function(models, options) {
		options || (options = {});
		this.cid = Aeris._.uniqueId('c');
		this.models = [];
		this.initialize.apply(this, arguments, options);
	};

	Aeris._.extend(Aeris.Collection.prototype, Aeris.Events, {

		// the default model for this collection
		model: Aeris.Model,
		// model store
		models: [],

		// the endpoint for this collection
		endpoint: null,

		// array of actions this collection/endpoint supports to be validated against
		// before doing any request to the API
		_supportedActions: [Aeris.actions.ID, Aeris.actions.CLOSEST, Aeris.actions.WITHIN, Aeris.actions.SEARCH],

		// default initialization logic
		initialize: function(){},

		// iterates through each model calling model.toJSON and pushing into wrapper array to return
		toJSON: function() {
			var ar = [];
			for (var i = 0, len = this.models.length; i < len; i++) {
				ar.push(this.models[i].toJSON());
			}
			return {models: ar};
		},

		// get a model from the set by id
		get: function(id) {
			if (id === null) return null;
			return this._byId[id.id != nul ? id.id : id];
		},

		// return model at the given index
		at: function(index) {
			return this.models[index];
		},

		// returns the total number of model objects currently loaded
		count: function() {
			return this.models.length;
		},

		// clears all models currently stored
		reset: function() {
			this.models.length = 0;
		},

		// determines if this collection supports a specific action
		supportsAction: function(action) {
			var sup = this._supportedActions;
			var supported = jQuery.inArray(action, sup);
			// if we didn't pass the actual text actions, check if we support the ID action
			// which allows any type of string
			if (!supported && sup.indexOf(Aeris.actions.ID) > -1) supported = true;
			return supported;
		},

		fetch: function(action, params) {
			if (!action || typeof(action) === 'object') {
				throw "InvalidAction";
			}
			params = params ? Aeris._.clone(params) : {};
			var options = {};
			var collection = this;
			options.data = params;
			options.success = function(response, status, xhr) {
				// verify successful response
				if (response && response.success === true) {
					debug(collection.toString() + ' - successfully loaded');
					collection._parseModels(response.response);
					collection.trigger('load', collection, response);
				}
				else {
					// trigger `load` event even if we have an empty data set
					if (response.error.code == 'no_data') {
						debug(collection.toString() + ' - empty response returned');
						//collection.trigger('nodata', collection);
						collection.trigger('load', collection);
					}
					else {
						debug(collection.toString() + ' - **ERROR**  code: ' + response.error.code + '; description: ' + response.error.description);
						collection.trigger('loaderror', collection, response.error.code, response.error.description);
					}
				}
			};
			options.error = function(xhr, status, error) {
				debug(collection.toString() + ' - **ERROR**  status: ' + status + '; error: ' + error);
				collection.trigger('loaderror', collection, status, error);
			};

			this.reset();
			Aeris.request(action, this, options);
		},

		// Converts a response into a series of model objects and adds to collection
		_parseModels: function(response) {
			if (response.length === 0) {
				this.models = [];
				return;
			}
			if (response[0]) {
				var i = 0;
				var len = response.length;
				var mobj;
				for (; i < len; i++) {
					this.models.push(this._prepareModel(response[i], {}));
				}
			}
			else {
				this.models.push(this._prepareModel(response, {}));
			}
		},

		_prepareModel: function(model, options) {
			if (!this.model) {
				throw "InvalidCollectionModel";
			}
			if (!(model instanceof Aeris.Model)) {
				var attrs = model;
				options.collection = this;
				model = new this.model(attrs, options);
				if (!model.collection) {
					model.collection = this;
				}
			}
			return model;
		}

	});

	//-----------
	// Aeris View
	//-----------

	Aeris.View = function(options) {
		this.cid = Aeris._.uniqueId('v');
		this._configure(options || {});
		this._ensureElement();
		this.initialize.apply(this, arguments);
	};

	var viewOptions = ['el', 'id', 'attributes', 'className', 'tagName', 'tpl', 'partials'];
	Aeris._.extend(Aeris.View.prototype, Aeris.Events, {

		// jQuery delegate for this element lookup, scoped to DOM elements within the current
		// view which is preferred to global lookups when possible
		$: function(selector) {
			return $(selector, this.el);
		},

		initialize: function(options) {
			var tpl, partials, helpers;

			// compile template
			if (typeof this.tpl === 'string') {
				tpl = this.tpl;
			}
			else {
				tpl = this.tpl.container;
				partials = this.tpl.partials || null;
				helpers = this.tpl.helpers || null;
			}

			this._tpl = tpl;
			this._template = Handlebars.compile(tpl);

			// register partials
			if (partials) {
				for (var key in partials) {
					Handlebars.registerPartial(key, partials[key]);
				}
			}

			// register helpers
			if (helpers) {
				for (var name in helpers) {
					Handlebars.registerHelper(name, helpers[name]);
				}
			}
		},

		make: function(tagName, attributes, content) {
			var el = document.createElement(tagName);
			if (attributes) $(el).attr(attributes);
			if (content) $(el).html(content);
			return el;
		},

		render: function(data) {
			if (!this._template) {
				throw "InvalidTemplate";
			}
			this.el = this._template(data);
			return this;
		},

		// Remove this view from the DOM.
		remove: function() {
			this.$el.remove();
			return this;
		},

		// returns an HTML snippet from our template based on selector
		snippet: function(selector) {
			var el = $(this._tpl);
			return $(selector, el).html();
		},

		setElement: function(element) {
			this.$el = $(element);
			this.el = this.$el[0];
		},

		addPartial: function(key, tpl) {
			Handlebars.registerPartial(key, tpl);
		},

		_configure: function(options) {
			if (this.options) options = Aeris._.extend({}, this.options, options);
			for (var i = 0, len = viewOptions.length; i < len; i++) {
				var attr = viewOptions[i];
				if (options[attr]) {
					this[attr] = options[attr];
					// if we have a template setting, we need to create the template ref code
					// for ICanHaz to use, and then add it to ICanHaz internals
					// if (attr == 'tpl') {
					// 	this.tplcode = this.cid + '_tpl';
					// 	ich.addTemplate(this.tplcode, this[attr]);
					// }
					// else if (attr == 'partials') {
					// 	for (var i in options[attr]) {
					// 		ich.addTemplate(i, options[attr][i]);
					// 	}
					// }
				}
			}
			this.options = options;
		},

		_ensureElement: function() {
			if (!this.el) {
				var attrs = {};
				if (this.id) attrs.id = this.id;
				if (this.className) attrs['class'] = this.className;
				this.setElement(this.make(this.tagName, attrs));
			}
			else {
				this.setElement(this.el);
			}
		}

	});


	// define default template helpers for Handlebars.js
	Aeris.templateHelpers = {
		upper: function(s) { return (s + '').toUpperCase(); },
		lower: function(s) { return (s + '').toLowerCase(); },
		ucwords: function(s) {
			return (s + '').replace(/^([a-z])|\s+([a-z])/g, function($1) {
				return $1.toUpperCase();
			});
		},
		ucfirst: function(s) {
			s += '';
			var f = s.charAt(0).toUpperCase();
			return f + s.substr(1);
		}
	};

	//-------------
	// Aeris Widget
	//-------------

	Aeris.Widget = function(el, options) {
		// handle default overrides
		options = options || {};
		options = $.extend(true, {}, Aeris.Widget.prototype.defaults, this.defaults, options);

		this.cid = Aeris._.uniqueId('w');
		this.el = el;
		this.rendered = false;
		this._configure(options || {});
		this._prepare();
		this.initialize.apply(this, arguments);
	};

	var widgetOptions = ['cls', 'expires', 'params', 'paths', 'tpl', 'opts', 'updates'];
	Aeris._.extend(Aeris.Widget.prototype, Aeris.Events, {

		defaults: {
			prefix: null,
			cls: '',
			tpl: '',
			collection: null,
			params: {
				p: ':auto'
			},
			opts: {
				expires: 0,
				autoload: true,
				units: Aeris.units.ENGLISH,
				resize: {
					auto: true,
					anim: false
				},
				loader: {
					show: true,
					anim: true
				},
				toolbar: {
					search: true,
					geolocate: true
				}
			},
			updates: {
				target: null
			}
		},

		// timer for reloading data when expires
		_timer: null,
		// whether or not widget has been rendered yet (for updating afterward)
		_rendered: false,

		// jQuery delegate for this element lookup, scoped to DOM elements within the current
		// view which is preferred to global lookups when possible
		$: function(selector) {
			return $(selector, this.el);
		},

		initialize: function(options) {
			if (!this.el) {
				throw "InvalidTarget";
			}

			//this.render();
			if (this.opts.autoload) {
				this.load();
			}
		},

		show: function(callback) {
			this.content.fadeIn(250, callback);
		},

		hide: function(callback) {
			this.content.fadeOut(250, callback);
		},

		width: function() {
			return parseInt(this.el.outerWidth(), 10);
		},

		height: function() {
			return parseInt(this.el.outerHeight(), 10);
		},

		resize: function(w, h, easing, callback) {
			if (this.opts.resize.auto === false) return;
			easing = easing || 'easeInOutQuint';
			if (this.opts.resize.anim) {
				this.el.animate({
					width: w,
					height: h
				}, 500, easing, callback);
			}
			else {
				this.el.css({ width: w, height: h });
				if (callback) callback();
			}
		},

		setUnits: function(units) {
			if (units != this.opts.units) {
				this.opts.units = units;
				this.render(this.collection.toJSON().data);
			}
		},

		isMetric: function() {
			return (this.opts.units == Aeris.units.METRIC);
		},

		showLoader: function() {
			if (this.opts.loader.show) {
				if (this.opts.loader.anim) {
					this.loader.fadeIn(200);
				}
				else {
					this.loader.show();
				}
			}
		},

		hideLoader: function() {
			if (this.opts.loader.show) {
				if (this.opts.loader.anim) {
					this.loader.fadeOut(200);
				}
				else {
					this.loader.hide();
				}
			}
		},

		showError: function(msg, duration) {
			var widget = this;
			if (!this._errorEl) return;

			this._errorEl.html(msg);
			// clear out existing timeout
			clearTimeout(this._errorTO);
			this._errorEl.slideDown(250, function(){
				if (duration > 0) widget._errorTO = setTimeout(function(){
					widget._errorEl.slideUp(250);
				}, duration);
			});
		},

		load: function() {
			// extending classes should provide their custom loading implementations
			throw "InvalidLoadRoutine";
		},

		reload: function(params) {
			Aeris._debug('Reloading widget data');
			// overwrite params if we're passing new ones
			if (params !== undefined) {
				this.params = $.extend(true, this.params, params);
			}

			this.load();
		},

		render: function(data) {
			var widget = this;

			// if this data expires, set timeout for reloading data
			if (this.opts.expires > 0) {
				// limit expiration to no less than 30 seconds
				if (this.opts.expires < 30) {
					//this.opts.expires = 30;
				}
				Aeris._debug('Setting widget timeout to ' + this.opts.expires + ' seconds');
				clearTimeout(this._timer);
				this._timer = setTimeout(function(){
					widget.reload();
				}, this.opts.expires * 1000);
			}

			// if we've already been rendered and we have an updates.target,
			// call this._update instead to only update parts of the widget
			if (this._rendered && this.updates.target) {
				this._update(data);
				return;
			}

			this.view = new Aeris.views.Custom({
				tpl: this.tpl
			});

			// need to pass global options to template along with data
			data = Aeris._.extend({}, Aeris.config, data);
			// pass widget params to template for any conditionals that are needed
			data.params = this.params;
			// pass units setting to template for conditions check
			data.metric = this.isMetric();

			this._beforeRender(data);
			this.content.html(this.view.render(data).el);

			// replace main loader with our update loader and hide initially
			if (this.$('.aeris-widget-loader-update').is('*')) {
				this.loader = this.$('.aeris-widget-loader-update');
				this.loader.hide();
			}
			this._prepareToolbar();
			this._rendered = true;
			//this.trigger.('render', this);
			this._afterRender(data);

			// resize base loader overlay
			var nw = this.width();
			var nh = parseInt(this.content.outerHeight(true), 10);
			if (!isNaN(nw) && !isNaN(nh) && nh > 0) {
				this.$('.aeris-widget-loader').css({ width: nw, height: nh });
				if (this.opts.resize.auto === true) {
					this.resize(nw, nh, null, function(){
						widget.show();
					});
				}
				else {
					widget.show();
				}
			}
			else {
				widget.show();
			}
		},

		// Methods to perform additional view stuff before and/or after rendering is completed.
		_beforeRender: function(data) {},
		_afterRender: function(data) {},

		_update: function(data) {
			this._beforeUpdate(data);
			if (this.updates.target) {
				var widget = this;
				var el = this.$(this.updates.target);
				el.fadeOut(250, function(){
					// render template using new data and replace update target with proper target
					// block from rendered template
					var html = $(widget.view.render(data).el);
					var newEl = $(widget.updates.target, html);
					//el.html(newEl.html());
					el.replaceWith(newEl);
					el.fadeIn(250);
				});
			}
			this._afterUpdate(data);
		},
		_beforeUpdate: function(data) {},
		_afterUpdate: function(data) {},

		// setup necessary events on toolbar controls if found in DOM element
		_prepareToolbar: function() {
			if (!this.$('.aeris-widget-tbar').is('*')) return;
			if (this.opts.toolbar === null || this.opts.toolbar === false) {
				this.$('.aeris-widget-tbar').hide();
			}

			var widget = this;
			var tbar = this.$('.aeris-widget-tbar');
			this._errorEl = this.$('.aeris-widget-error-top');
			this._errorEl.hide();

			// shift loading over next to toolbar
			this.loader.css({ right: tbar.width() + 3 });

			// search box
			if ($('.aeris-widget-tbar-btn-search', tbar).is('*')) {
				if (this.opts.toolbar.search === false) {
					$('.aeris-widget-tbar-btn-search', tbar).remove();
				}
				var searchEl = this.$('.aeris-widget-search');
				searchEl.hide();
				$('.aeris-widget-tbar-btn-search', tbar).click(function(e){
					if (searchEl.is(':visible')) {
						searchEl.slideUp(250, 'easeInOutQuint');
					}
					else {
						searchEl.slideDown(250, 'easeInOutQuint');
						$('input', searchEl).val('').focus();
					}
				});
				// search submission
				$('.aeris-widget-tbar-btn', searchEl).click(function(e){
					var val = $('input', searchEl).val();
					if (val !== '') {
						widget.params.p = $('input', searchEl).val();
						searchEl.slideUp(250, 'easeInOutQuint');
						widget.collection.reset();
						widget.load();
					}
				});
				// bind enter key to submit
				$('input', searchEl).bind('keypress', function(e){
					var code = e.keyCode ? e.keyCode : e.which;
					if (code == 13) $('.aeris-widget-tbar-btn', searchEl).click();				// submit search form
					else if (code == 27) $('.aeris-widget-tbar-btn-search', tbar).click();		// close search block
				});
			}

			// geolocate button
			if ($('.aeris-widget-tbar-btn-geolocate', tbar).is('*')) {
				if (this.opts.toolbar.geolocate === false) {
					$('.aeris-widget-tbar-btn-geolocate', tbar).remove();
				}
				$('.aeris-widget-tbar-btn-geolocate', tbar).click(function(e){
					var searchEl = widget.$('.aeris-widget-search');
					if (searchEl.is(':visible')) {
						searchEl.slideUp(250, 'easeInOutQuint');
					}
					widget.params.p = ':auto';
					widget.collection.reset();
					widget.load();
				});
			}
		},

		// Creates loader element to display as data is loading
		// as well as main container for our template
		_prepare: function() {
			this.el.append('<div id="aeris-' + this.cid + '" class="aeris-widget aeris-widget-' + this.prefix + ' ' + ((this.cls) ? this.cls.split(',').join(' ') : '') + '"><div class="aeris-widget-content"></div><div class="aeris-widget-loader"></div></div>');
			this.loader = this.$('.aeris-widget-loader');
			this.content = this.$('.aeris-widget-content');
			this.content.css({visible:false});
			if (this.prefix) {
				this.content.addClass('aeris-widget-' + this.prefix + '-content');
				this.loader.addClass('aeris-widget-' + this.prefix + '-loader');
			}
			// hide content container initially until we've rendered our template
			//this.content.hide();

			// verify our inner container doesn't extend beyond our DOM container
			var ow = parseInt(this.$('.aeris-widget').outerWidth(), 10);
			var w = parseInt(this.el.width(), 10);
			if (!isNaN(ow) && !isNaN(w) && ow > w) {
				this.$('.aeris-widget').width(w - (ow - w));
			}

			// resize loader div to size of widget container
			var container = this.$('.aeris-widget');
			this.loader.css({ width: parseInt(container.width(), 10), height: parseInt(container.height(), 10) });
		},

		_configure: function(options) {
			for (var i = 0, len = widgetOptions.length; i < len; i++) {
				var attr = widgetOptions[i];
				if (options[attr]) {
					this[attr] = options[attr];
				}
			}

			if (!this.opts.updates || this.opts.updates.target) {
				this.opts.updates = {
					target: '.aeris-widget-bottom'
				};
			}

			// convert this.tpl to main object for handing off to view
			if (typeof this.tpl === 'string') {
				var _tpl = this.tpl;
				var _helpers = (this.defaults.tpl.helpers) ? this.defaults.tpl.helpers : {};
				var _partials = (this.defaults.tpl.partials) ? this.defaults.tpl.partials : {};
				this.tpl = {
					container: _tpl,
					partials: _partials,
					helpers: _helpers
				};
			}
			// extend with our defaults
			this.tpl = $.extend(true, {
				partials: {
					search: '<div class="aeris-widget-search">' +
							'<label>Location</label><input type="text" name="aeris-stmreports-search" />' +
							'<a class="aeris-widget-tbar-btn aeris-widget-tbar-btn-submit"></a>' +
						'</div>',
					toolbar: '<div class="aeris-widget-tbar">' +
							'<div class="aeris-widget-tbar-ctrls">' +
								'<a class="aeris-widget-tbar-btn aeris-widget-tbar-btn-search"></a>' +
								'<a class="aeris-widget-tbar-btn aeris-widget-tbar-btn-geolocate"></a>' +
							'</div>' +
						'</div>',
					error: '<div class="aeris-widget-error-top">{{message}}</div>'
				},
				helpers: {
					upper: function(s) { return (s + '').toUpperCase(); },
					lower: function(s) { return (s + '').toLowerCase(); },
					ucwords: function(s) {
						s = (s + '').toLowerCase();
						return (s + '').replace(/^([a-z])|\s+([a-z])|\/([a-z])|(\-[a-z])/g, function($1) {
							return $1.toUpperCase();
						});
					},
					ucfirst: function(s) {
						s += '';
						var f = s.charAt(0).toUpperCase();
						return f + s.substr(1);
					},
					timeofday: function(s) {
						var d;
						var now = new Date();
						if (typeof(s) === 'string') {
							var p = s.split(/-|\+|\s+|:|T/);
							d = new Date(p[0], p[1]-1, p[2], p[3], p[4], p[5], 0);
						}
						else {
							d = new Date(s * 1000);
						}

						s = 'Today';
						if (d.getDate() > now.getDate()) s = 'Tomorrow';
						else if (d.getHours() >= 18) s = 'Tonight';
						return s;
					},
					cleanName: function(s) {
						s += '';
						s.replace(/,.+$/, '');
						return s;
					}
				}
			}, this.tpl);
		},

		// Handles geolocating the user if params.p is set to `:auto` then resets params.p to the value
		// Returns `false` if we are not geolocating so that the widget's `load` method can continue. This should only
		// be used if we are on a mobile device as the API has support for p=:auto already.
		//
		// Each Aeris.Widget instance should call the following at the top of its `load` method (if supporting geolocating):
		// if (this._geo()) return;
		_geo: function() {
			var widget = this;
			if (this.params.p == ':auto' && Aeris.isMobile() === true && _doGeo === true) {
				Aeris.geolocate(function(){
					if (Aeris.geo.lat && Aeris.geo.lon) {
						widget.params.p = Aeris.geo.lat + ',' + Aeris.geo.lon;
					}
					widget.load();
				});
				return true;
			}
			return false;
		}

	});

	/**
	 * Support calling parent widget objects from their subclasses.
	 */
	Aeris.Widget.prototype._super = function(funcName) {
		return this.constructor.__super__[funcName].apply(this, _.rest(arguments));
	};


	//--------------
	// Aeris Request
	//--------------

	// Provides a standard class for performing all API requests
	Aeris.request = function(action, collection, options) {
		// make sure Aeris has been configured with a valid client id and secret
		if (!Aeris.config || !Aeris.config.client_id || !Aeris.config.client_secret) {
			throw "InvalidOauth";
		}
		// append OAuth2 params
		options.data = Aeris._.extend({}, options.data, {
			client_id: Aeris.config.client_id,
			client_secret: Aeris.config.client_secret
		});
		if (options.data.p) options.data.p.toLowerCase();

		// configure route
		var route = Aeris.config.base;
		if (collection.endpoint) {
			route += collection.endpoint;
			if (action) {
				route += '/' + action;
			}
		}
		else {
			throw "InvalidEndpoint";
		}

		// verify collection supports the requested action if not BATCH request
		if (collection.endpoint !== Aeris.endpoints.BATCH && !collection.supportsAction(action)) {
			throw "UnsupportedAction";
		}

		// handle expiration/caching
		// enable caching by jQuery but append our own timestamp based on our passed cache value
		var min = (options.expires) ? options.expires : 15;	// default cache of 15 minutes
		if (min < 1) min = 1;
		var now = new Date().getTime();
		var d = new Date(now + min * 60 * 1000);
		var dm = String("00000" + d.getMonth()).slice(-2);
		var dd = String("00000" + d.getDate()).slice(-2);
		var dh = String("00000" + d.getHours()).slice(-2);
		var dmn = String("00000" + d.getMinutes()).slice(-2);
		var ts = d.getFullYear().toString() + dm + dd + dh + ((min < 60) ? dmn : '');
		options.data._ = ts;

		debug('url: ' + route + '; params: ' + $.param(options.data));
		var appId = document.documentURI || '';
		options.data.app_id = appId.replace(/^(?:https?|chrome|file)\:\/\/(www\.)?/, '').replace(/\/.*$/, '');

		var params = {type:'GET', dataType:'jsonp', url:route, cache:true, crossDomain:true};
		return $.ajax(Aeris._.extend(params, options));
	};

	// Stores geolocated lat,lon when set
	var _doGeo = true;
	Aeris.geo = { lat: null, lon: null };
	Aeris.geolocate = function(callback) {
		// if a mobile device, just use the W3C Geo API
		// otherwise load in the Maxmind GeoIP database JS (http://maxmind.com/)
		if (Aeris.isMobile() && navigator && navigator.geolocation !== null) {
			var onGeoSuccess = function(pos) {
				clearTimeout(to);
				Aeris.geo = {
					lat: pos.coords.latitude,
					lon: pos.coords.longitude
				};
				if (callback) callback();
			};
			var onGeoFail = function(error) {
				_doGeo = false;
				clearTimeout(to);
				var str = '';
				switch (error.code) {
					case 1:
						str = 'User denied geolocation.';
						break;
					case 2:
						str = 'Position unavailable.';
						break;
					case 3:
						str = 'Timeout expired.';
						break;
					default:
						str = error.message;
						break;
				}
				if (callback) callback();
			};
			// need timeout to handle if user doesn't respond to popup or clicks "Not Now" instead of "Never"
			// which is a known bug in FF for not calling error handlers properly
			// https://bugzilla.mozilla.org/show_bug.cgi?id=675533
			var to = setTimeout(onGeoFail, 7000);
			navigator.geolocation.getCurrentPosition(onGeoSuccess, onGeoFail);
		}
		else {
			_doGeo = false;
			if (callback) callback();
		}
	};

	// Determines if the current browser is within a mobile device
	Aeris.isMobile = function() {
		return (/iphone|ipad|ipod|android|blackberry|mini|windows\sce|palm/i.test(navigator.userAgent.toLowerCase()));
	};

	/**
	* The following `extend` and `inherits` helper functions are barrowed from backbone.js
	* as they handle object subclassing much better than doing a standard `extend`.
	* http://documentcloud.github.com/backbone/
	*/
	var extend = function(protoProps, classProps) {
		var child = inherits(this, protoProps, classProps);
		child.extend = this.extend;
		return child;
	};
	Aeris.Model.extend = Aeris.Collection.extend = Aeris.View.extend = Aeris.Widget.extend = extend;

	// shared empty constructor function to aid in prototype-chain creation
	var ctor = function(){};

	var inherits = function(parent, protoProps, staticProps) {
		var child;
		if (protoProps && protoProps.hasOwnProperty('constructor')) {
			child = protoProps.constructor;
		}
		else {
			child = function(){ parent.apply(this, arguments); };
		}

		// inherit class (static) properties from parent
		Aeris._.extend(child, parent);

		// set the prototype chain to inherit from `parent`, without calling `parent`'s constructor function
		ctor.prototype = parent.prototype;
		child.prototype = new ctor();

		// add prototype properties (instance properties) to the subclass
		if (protoProps) Aeris._.extend(child.prototype, protoProps);

		// add static properties to the constructor function
		if (staticProps) Aeris._.extend(child, staticProps);

		// correctly set child's `prototype.constructor`
		child.prototype.constructor = child;
		// set a convenience property in case the parent's prototype is needed later
		child.__super__ = parent.prototype;

		return child;
	};

	var recompose = function(key, obj) {
		if (obj === null) return obj;
		var parts = key.split('.');
		var o = obj[parts[0]];
		if (parts[1]){
			parts.splice(0,1);
			var str = parts.join('.');
			return recompose(str, o);
		}
		return o;
	};

	Aeris.setDebug = function(enable) {
		Aeris.debug = enable;
	};
	var debug = function(str) {
		if (Aeris.debug === true) {
			if (typeof console !== 'undefined' && console.log !== undefined) console.log('[AerisJS] - ' + str);
		}
	};
	Aeris._debug = debug;
	if (Aeris.config.debug === true) Aeris.setDebug(true);

	// use setTimeout to ensure our code is called at the end of the execution stack
	// then check if user has Aeris.onReady defined
	// hat tip: http://blog.errorception.com/2012/01/writing-quality-third-party-js-part-3.html
	window.setTimeout(function(){
		// setup any dependencies we need to load before we're finally ready
		var libsToLoad = [];
		if (Aeris.config.widgets === true) {
			// make sure the jQuery UI plugins required by our built-in widgets are loaded
			if (typeof $.ui === 'undefined' || typeof $.ui.autocomplete === 'undefined') {
				libsToLoad.push('jquery.ui');
			}
			libsToLoad.push('aeris.widgets');
		}
		// custom user dependencies
		if (Aeris.config.dependencies) {
			for (var i in Aeris.config.dependencies) {
				libsToLoad.push(Aeris.config.dependencies[i]);
			}
		}

		if (libsToLoad.length > 0) {
			Aeris.require(libsToLoad, function(){
				if (Aeris.onReady) Aeris.onReady();
			});
		}
		else {
			if (Aeris.onReady) Aeris.onReady();
		}
	}, 0);


	//----------------
	// Endpoint Models
	//----------------
	Aeris.provide('Aeris.models');

	Aeris.models.Place = Aeris.Model.extend();
	Aeris.models.Country = Aeris.Model.extend();
	Aeris.models.Observation = Aeris.Model.extend();
	Aeris.models.ObservationRecent = Aeris.Model.extend();
	Aeris.models.ObservationArchive = Aeris.Model.extend();
	Aeris.models.Forecast = Aeris.Model.extend();
	Aeris.models.Advisory = Aeris.Model.extend();
	Aeris.models.StormCell = Aeris.Model.extend();
	Aeris.models.StormReport = Aeris.Model.extend();
	Aeris.models.Fire = Aeris.Model.extend();
	Aeris.models.Record = Aeris.Model.extend();
	Aeris.models.Earthquake = Aeris.Model.extend();
	Aeris.models.Sunmoon = Aeris.Model.extend();
	Aeris.models.Moonphase = Aeris.Model.extend();
	Aeris.models.Tide = Aeris.Model.extend();
	Aeris.models.TidesStation = Aeris.Model.extend();
	Aeris.models.Normal = Aeris.Model.extend();
	Aeris.models.NormalStation = Aeris.Model.extend();



	//---------------------
	// Endpoint Collections
	//---------------------
	Aeris.provide('Aeris.collections');

	Aeris.collections.Batch = Aeris.Collection.extend({
		collections: [],

		initialize: function() {
			this.collections = [];
			this.endpoint = Aeris.endpoints.BATCH;
		},

		// Override to provide custom batch implementation
		// Each collection will be keyed by its endpoint for referencing in returned JSON object.
		toJSON: function() {
			var c = {};
			for (var i = 0, len = this.collections.length; i < len; i++) {
				var coll = this.collections[i];
				var ep = coll.endpoint;
				var data = coll.toJSON();
				if (c[ep] !== undefined && c[ep].length > 0) {
					for (var j = 0, jlen = data.models.length; j < jlen; j++) {
						c[ep].push(data.models[j]);
					}
				}
				else {
					c[ep] = data.models;
				}
			}
			return {data: c};
		},

		// Returns a single collection at the specified index
		get: function(index) {
			return this.collections[index] || null;
		},

		// Returns all collections for this batch request that matches a specific endpoint.
		getByEndpoint: function(endpoint) {
			var c = [];
			for (var i = 0, len = this.collections.length; i < len; i++) {
				if (this.collections[i].endpoint == endpoint) {
					c.push(this.collections[i]);
				}
			}
			return c;
		},

		reset: function() {
			for (var i = 0, len = this.collections.length; i < len; i++) {
				this.collections[i].reset();
			}
		},

		// Override superclass `fetch` function to handle batch requests.
		// Method essentially iterates through each passed request object from `requests` and builds the query string to set
		// to the API `requests` parameter.
		// On a successful response, success handler will iterate through each response object from `responses` and create
		// each individual collection object for that endpoint, each containing its own set of model objects within it.
		fetch: function(requests, params) {
			if (!requests || requests.count === 0) {
				throw "InvalidRequest";
			}
			params = params ? Aeris._.clone(params) : {};
			var options = {};
			var collection = this;

			// iterate through requests and build encoded URL value
			var req = [];
			for (var i = 0, len = requests.length; i < len; i++) {
				var ep = requests[i].endpoint;
				var ac = requests[i].action;
				var opts = requests[i].params || {};

				// make sure API supports requested endpoint
				if (Aeris.supportsEndpoint(ep) === false)
					continue;

				// if no "p" or "id" provided and global "p" is auto, then set proper action
				if (!opts.p && !opts.id && params.p) {
					if (params.p == ':auto') {
						ac = Aeris.actions.CLOSEST;
					}
				}

				// if action is ID and we have a `p` or `id` passed in the params, reset values
				if (!ac || ac == Aeris.actions.ID) {
					// if no "p" or "id" for this request, but set at global batch level, set for this request
					if ((!opts.p || !opts.id) && params.p) {
						ac = params.p;
					}
					else {
						ac = opts.id || opts.p;
					}
					ac = (ac + '').toLowerCase();
					if (opts.id) delete opts.id;
					if (opts.p) delete opts.p;
				}

				var route = '/' + ep;
				// verify collection supports the requested action if not BATCH request
				if (!this.supportsAction(ac)) {
					throw "UnsupportedAction";
				}
				else {
					route += '/' + ac;
				}

				// add params as query string
				if (opts && Aeris._.size(opts) > 0) {
					route += '?' + $.param(opts);
				}
				req.push(route);
			}

			// store our request param along with the other globals passed
			params.requests = req.join(',');
			options.data = params;

			options.success = function(json, status, xhr) {
				// verify successful response
				if (json && json.success === true) {
					var responses = json.response.responses;

					// iterate through out response objects and convert to the proper collection
					var error = null;
					for (var i = 0, len = responses.length; i < len; i++) {
						var collResponse = responses[i];
						var coll = collection._prepareCollection(collResponse.request, collResponse.response);
						// trigger error if any errors for this single response
						if (!collResponse.success) {
							collection.trigger('collectionerror', coll);
							error = collResponse.error;
						}
					}

					if (error && error.code !== 'no_data') {
						//debug('Batch response failed - **ERROR**  code: ' + error.code + '; description: ' + error.description + '; params: ' + $.param(collection.params));
						collection.trigger('loaderror', collection, error.code, error.description);
					}
					else {
						collection.trigger('load', collection, json);
					}
				}
				else {
					//debug('Batch response failed - **ERROR**  code: ' + json.error.code + '; description: ' + json.error.description + '; params: ' + $.param(collection.params));
					collection.trigger('loaderror', collection, json.error.code, json.error.description);
				}
			};
			options.error = function(xhr, status, error) {
				//debug('Batch request failed - params: ' + $.param(collection.params));
				collection.trigger('loaderror', collection, status, error);
			};
			Aeris.request(null, this, options);
		},

		// Creates an individual Aeris.Collection object based on the returned request path
		// and parses all necessary models into it.
		_prepareCollection: function(request, response) {
			var c;
			var endpoint = request.replace(/^\/(\w+)\/.+$/, "$1");
			switch (endpoint) {
				case Aeris.endpoints.PLACES:
					c = new Aeris.collections.Places(); break;
				case Aeris.endpoints.COUNTRIES:
					c = new Aeris.collections.Countries(); break;
				case Aeris.endpoints.OBS:
					c = new Aeris.collections.Observations(); break;
				case Aeris.endpoints.OBSRECENT:
					c = new Aeris.collections.ObservationsRecent(); break;
				case Aeris.endpoints.OBSARCHIVE:
					c = new Aeris.collections.ObservationsArchive(); break;
				case Aeris.endpoints.FORECASTS:
					c = new Aeris.collections.Forecasts(); break;
				case Aeris.endpoints.ADVISORIES:
					c = new Aeris.collections.Advisories(); break;
				case Aeris.endpoints.STMCELLS:
					c = new Aeris.collections.StormCells(); break;
				case Aeris.endpoints.STMREPORTS:
					c = new Aeris.collections.StormReports(); break;
				case Aeris.endpoints.FIRES:
					c = new Aeris.collections.Fires(); break;
				case Aeris.endpoints.EARTHQUAKES:
					c = new Aeris.collections.Earthquakes(); break;
				case Aeris.endpoints.RECORDS:
					c = new Aeris.collections.Records(); break;
				case Aeris.endpoints.SUNMOON:
					c = new Aeris.collections.Sunmoons(); break;
				case Aeris.endpoints.MOONPHASES:
					c = new Aeris.collections.Moonphases(); break;
				case Aeris.endpoints.TIDES:
					c = new Aeris.collections.Tides(); break;
				case Aeris.endpoints.TIDESSTATIONS:
					c = new Aeris.collections.TidesStations(); break;
				case Aeris.endpoints.NORMALS:
					c = new Aeris.collections.Normals(); break;
				case Aeris.endpoints.NORMALSSTATIONS:
					c = new Aeris.collections.NormalsStations(); break;
				default:
					break;
			}

			if (c !== undefined) {
				// parse models into this collection
				c._parseModels(response);
				this.collections.push(c);
			}

			return c;
		},

		// Method to group common requests together into a single request that will allow us
		// to better handle the API's max requests per batch limit.
		//
		// Will return an array of batch request objects based on their endpoints.
		_groupRequests: function(requests) {

		}

	});

	Aeris.collections.Places = Aeris.Collection.extend({
		initialize: function() {
			this.model = Aeris.models.Place;
			this.endpoint = Aeris.endpoints.PLACES;
		},
		toString: function() {
			return 'Aeris.collections.Places';
		}
	});

	Aeris.collections.Countries = Aeris.Collection.extend({
		initialize: function() {
			this.model = Aeris.models.Country;
			this.endpoint = Aeris.endpoints.COUNTRIES;
		},
		toString: function() {
			return 'Aeris.collections.Countries';
		}
	});

	Aeris.collections.Observations = Aeris.Collection.extend({
		initialize: function() {
			this.model = Aeris.models.Observation;
			this.endpoint = Aeris.endpoints.OBS;
		},
		toString: function() {
			return 'Aeris.collections.Observations';
		}
	});

	Aeris.collections.ObservationsRecent = Aeris.Collection.extend({
		initialize: function() {
			this.model = Aeris.models.ObservationRecent;
			this.endpoint = Aeris.endpoints.OBSRECENT;
		},
		toString: function() {
			return 'Aeris.collections.ObservationsRecent';
		}
	});

	Aeris.collections.ObservationsArchive = Aeris.Collection.extend({
		initialize: function() {
			this.model = Aeris.models.ObservationArchive;
			this.endpoint = Aeris.endpoints.OBSARCHIVE;
		},
		toString: function() {
			return 'Aeris.collections.ObservationsArchive';
		}
	});

	Aeris.collections.Forecasts = Aeris.Collection.extend({
		initialize: function() {
			this.model = Aeris.models.Forecast;
			this.endpoint = Aeris.endpoints.FORECASTS;
		},
		toString: function() {
			return 'Aeris.collections.Forecasts';
		}
	});

	Aeris.collections.Advisories = Aeris.Collection.extend({
		initialize: function() {
			this.model = Aeris.models.Advisory;
			this.endpoint = Aeris.endpoints.ADVISORIES;
		},
		toString: function() {
			return 'Aeris.collections.Advisories';
		}
	});

	Aeris.collections.StormCells = Aeris.Collection.extend({
		initialize: function() {
			this.model = Aeris.models.StormCell;
			this.endpoint = Aeris.endpoints.STMCELLS;
		},
		toString: function() {
			return 'Aeris.collections.StormCells';
		}
	});

	Aeris.collections.StormReports = Aeris.Collection.extend({
		initialize: function() {
			this.model = Aeris.models.StormReport;
			this.endpoint = Aeris.endpoints.STMREPORTS;
		},
		toString: function() {
			return 'Aeris.collections.StormReports';
		}
	});

	Aeris.collections.Fires = Aeris.Collection.extend({
		initialize: function() {
			this.model = Aeris.models.Fire;
			this.endpoint = Aeris.endpoints.FIRES;
		},
		toString: function() {
			return 'Aeris.collections.Fires';
		}
	});

	Aeris.collections.Earthquakes = Aeris.Collection.extend({
		initialize: function() {
			this.model = Aeris.models.Earthquake;
			this.endpoint = Aeris.endpoints.EARTHQUAKES;
		},
		toString: function() {
			return 'Aeris.collections.Earthquakes';
		}
	});

	Aeris.collections.Records = Aeris.Collection.extend({
		initialize: function() {
			this.model = Aeris.models.Record;
			this.endpoint = Aeris.endpoints.RECORDS;
		},
		toString: function() {
			return 'Aeris.collections.Records';
		}
	});

	Aeris.collections.Sunmoons = Aeris.Collection.extend({
		initialize: function() {
			this.model = Aeris.models.Sunmoon;
			this.endpoint = Aeris.endpoints.SUNMOON;
		},
		toString: function() {
			return 'Aeris.collections.Sunmoons';
		}
	});

	Aeris.collections.Moonphases = Aeris.Collection.extend({
		initialize: function() {
			this.model = Aeris.models.Moonphase;
			this.endpoint = Aeris.endpoints.MOONPHASES;
		},
		toString: function() {
			return 'Aeris.collections.Moonphases';
		}
	});

	Aeris.collections.Normals = Aeris.Collection.extend({
		initialize: function() {
			this.model = Aeris.models.Normal;
			this.endpoint = Aeris.endpoints.NORMALS;
		},
		toString: function() {
			return 'Aeris.collections.Normals';
		}
	});

	Aeris.collections.NormalsStations = Aeris.Collection.extend({
		initialize: function() {
			this.model = Aeris.models.NormalsStation;
			this.endpoint = Aeris.endpoints.NORMALSSTATIONS;
		},
		toString: function() {
			return 'Aeris.collections.NormalsStations';
		}
	});

	Aeris.collections.Tides = Aeris.Collection.extend({
		initialize: function() {
			this.model = Aeris.models.Tide;
			this.endpoint = Aeris.endpoints.TIDES;
		},
		toString: function() {
			return 'Aeris.collections.Tides';
		}
	});

	Aeris.collections.TidesStations = Aeris.Collection.extend({
		initialize: function() {
			this.model = Aeris.models.TidesStation;
			this.endpoint = Aeris.endpoints.TIDESSTAIONS;
		},
		toString: function() {
			return 'Aeris.collections.TidesStations';
		}
	});



	//-----------
	// Sample Views
	//-----------
	Aeris.provide('Aeris.views');

	Aeris.views.Custom = Aeris.View.extend();


}).call(this, jQuery);