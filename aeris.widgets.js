/**
*
* @package Aeris JS Toolkit
* @version $Id: aeris.widgets.js 1097 2012-10-12 22:25:09Z nshipes $
* @copyright (c) 2012 HAMweather, LLC <http://www.hamweather.com>
* @license {LICENSE_URL} {LICENSE_TYPE}
*
*/

(function(){

	// reference to the global object
	var root = this;
	var $ = root.jQuery;

	// top-level namespace from which all classes will be attached to
	var Aeris = root.Aeris;
	if (!Aeris) {
		throw "AerisException";
	}


	//--------
	// Widgets
	//--------
	Aeris.provide('Aeris.widgets');

	// Current Conditions Widget
	Aeris.widgets.Currents = Aeris.Widget.extend({
		prefix: 'currents',
		defaults: {
			cls: '',
			tpl: '<div class="aeris-widget-outer aeris-widget-currents">' +
				'<div class="aeris-widget-inner">' +
					'<div class="aeris-widget-top">' +
						'<div class="aeris-widget-title">{{places.0.place.name}}, {{places.0.place.state}}</div>' +
						'<div class="aeris-widget-loader-update"></div>' +
						'<div class="aeris-widget-tbar">' +
							'<div class="aeris-widget-tbar-ctrls">' +
								'<a class="aeris-widget-tbar-btn aeris-widget-tbar-btn-search"></a>' +
								'<a class="aeris-widget-tbar-btn aeris-widget-tbar-btn-geolocate"></a>' +
							'</div>' +
						'</div>' +
					'</div>' +
					'{{> search}}' +
					'{{#advisories}}<div class="aeris-widget-currents-advblock">' +
						'<span class="aeris-widget-currents-adv">{{details.name}}</span>' +
					'</div>{{/advisories}}' +
					'<div class="aeris-widget-bottom">' +
						'<div class="aeris-widget-currents-wxblock">' +
							'<div class="aeris-widget-currents-icon{{#observations.0.ob.isDay}} aeris-widget-currents-icon-day{{/observations.0.ob.isDay}}"><img src="{{paths.wxicons}}{{observations.0.ob.icon}}" /></div>' +
							'<div class="aeris-widget-currents-temp">{{#if metric}}{{observations.0.ob.tempC}}{{else}}{{observations.0.ob.tempF}}{{/if}}&deg;<span class="aeris-widget-unit aeris-widget-unit-temp">{{#if metric}}C{{else}}F{{/if}}</span></div>' +
						'</div>' +
						'<div class="aeris-widget-currents-detblock">' +
							'<div class="aeris-widget-currents-wx">{{observations.0.ob.weatherShort}}</div>' +
							'<ul>' +
								'<li><p class="aeris-widget-currents-detail-label">Feels Like</p><p class="aeris-widget-currents-detail-value">{{#if metric}}{{observations.0.ob.feelslikeC}}{{else}}{{observations.0.ob.feelslikeF}}{{/if}}&deg;</p></li>' +
								'<li><p class="aeris-widget-currents-detail-label">Winds</p><p class="aeris-widget-currents-detail-value">{{observations.0.ob.windDir}} {{#if metric}}{{observations.0.ob.windKPH}} kmh{{else}}{{observations.0.ob.windMPH}} mph{{/if}}</p></li>' +
								'<li><p class="aeris-widget-currents-detail-label">Dew Point</p><p class="aeris-widget-currents-detail-value">{{#if metric}}{{observations.0.ob.dewpointC}}{{else}}{{observations.0.ob.dewpointF}}{{/if}}&deg;</p></li>' +
								'<li><p class="aeris-widget-currents-detail-label">Humidity</p><p class="aeris-widget-currents-detail-value">{{observations.0.ob.humidity}}%</p></li>' +
								'<li><p class="aeris-widget-currents-detail-label">Pressure</p><p class="aeris-widget-currents-detail-value">{{#if metric}}{{observations.0.ob.pressureMB}} mb{{else}}{{observations.0.ob.pressureIN}} in{{/if}}</p></li>' +
							'</ul>' +
						'</div>' +
					'</div>' +
				'</div>' +
			'</div>'
		},

		load: function() {
			if (this._geo()) return;

			this.showLoader();
			var widget = this;

			if (!this.collection) {
				this.collection = new Aeris.collections.Batch();
				this.collection.bind('load', function(collection){
					widget.hideLoader();
					widget.render(collection.toJSON().data);
				});
				this.collection.bind('loaderror', function(collection, code, error){
					widget.hideLoader();
					widget.showError(error, 2000);
				});
			}

			this.collection.fetch([{
				endpoint: Aeris.endpoints.PLACES,
				params: {
					p: this.params.p
				}
			},{
				endpoint: Aeris.endpoints.OBS,
				params: {
					p: this.params.p
				}
			},{
				endpoint: Aeris.endpoints.ADVISORIES,
				params: {
					p: this.params.p
				}
			}], {});
		},

		_afterRender: function(data) {
			var maxw = this.$('.aeris-widget-bottom').width();
			var l = this.$('.aeris-widget-currents-wxblock');
			var r = this.$('.aeris-widget-currents-detblock');
			var w = maxw - l.outerWidth(true) - parseInt(l.css('left'), 10) - parseInt(r.css('right'), 10) - 10;
			r.css({width:w});
		}

	});


	// Currents Compact Widget
	Aeris.widgets.CurrentsCompact = Aeris.Widget.extend({
		prefix: 'currents-compact',
		defaults: {
			cls: '',
			tpl: '<div class="aeris-widget-outer aeris-widget-currents-compact">' +
				'<div class="aeris-widget-inner">' +
					'<div class="aeris-widget-currents-compact-icon"><img src="{{paths.wxicons}}{{observations.0.ob.icon}}" /></div>' +
					'<div class="aeris-widget-currents-compact-temp">{{#if metric}}{{observations.0.ob.tempC}}{{else}}{{observations.0.ob.tempF}}{{/if}}&deg;</div>' +
					'{{#advisories}}<div class="aeris-widget-currents-compact-alert"></div>{{/advisories}}' +
				'</div>' +
			'</div>'
		},
		load: function() {
			if (this._geo()) return;

			this.showLoader();
			var widget = this;

			if (!this.collection) {
				this.collection = new Aeris.collections.Batch();
				this.collection.bind('load', function(collection){
					widget.hideLoader();
					widget.render(collection.toJSON().data);
				});
				this.collection.bind('loaderror', function(collection, code, error){
					widget.hideLoader();
					widget.showError(error, 2000);
				});
			}

			this.collection.fetch([{
				endpoint: Aeris.endpoints.PLACES
			},{
				endpoint: Aeris.endpoints.OBS
			},{
				endpoint: Aeris.endpoints.ADVISORIES
			}], { p: this.params.p });
		}
	});


	// 24hr Outlook Compact
	Aeris.widgets.ShortTermOutlookCompact = Aeris.Widget.extend({
		prefix: '24hr-compact',
		defaults: {
			cls: '',
			tpl: {
				container: '<div class="aeris-widget-outer aeris-widget-24hr-compact">' +
					'<div class="aeris-widget-inner">' +
						'<div class="aeris-widget-24hr-compact-now">' +
							'<div class="aeris-widget-24hr-compact-pad">' +
								'<div class="aeris-widget-24hr-compact-title">Currently</div>' +
								'<div class="aeris-widget-24hr-compact-icon"><img src="{{paths.wxicons}}{{observations.0.ob.icon}}" /></div>' +
								'<div class="aeris-widget-24hr-compact-temp">{{#if metric}}{{observations.0.ob.tempC}}{{else}}{{observations.0.ob.tempF}}{{/if}}&deg;</div>' +
								'{{#advisories}}<div class="aeris-widget-currents-compact-alert"></div>{{/advisories}}' +
							'</div>' +
						'</div>' +
						'<div class="aeris-widget-24hr-compact-periods">' +
							'{{#forecasts.0.periods}}<div class="aeris-widget-24hr-compact-period">' +
								'<div class="aeris-widget-24hr-compact-title">{{timeofday validTime}}</div>' +
								'<div class="aeris-widget-24hr-compact-pad">' +
									'<div class="aeris-widget-24hr-compact-icon"><img src="{{../paths.wxicons}}{{icon}}" /></div>' +
									'<div class="aeris-widget-24hr-compact-temp">{{minmax this ../metric}}&deg;</div>' +
								'</div>' +
							'</div>{{/forecasts.0.periods}}' +
						'</div>' +
					'</div>' +
				'</div>',
				helpers: {
					minmax: function(v, metric) {
						if (v.isDay === true) return (metric ? v.maxTempC : v.maxTempF);
						return (metric ? v.minTempC : v.minTempF);
					}
				}
			},
			params: {
				filter: 'daynight',
				limit: 2
			}
		},

		load: function() {
			if (this._geo()) return;

			this.showLoader();
			var widget = this;

			if (!this.collection) {
				this.collection = new Aeris.collections.Batch();
				this.collection.bind('load', function(collection){
					widget.hideLoader();
					widget.render(collection.toJSON().data);
				});
				this.collection.bind('loaderror', function(collection, code, error){
					widget.hideLoader();
					widget.showError(error, 2000);
				});
			}

			this.collection.fetch([{
				endpoint: Aeris.endpoints.OBS,
				params: {
					p: this.params.p
				}
			},{
				endpoint: Aeris.endpoints.ADVISORIES,
				params: { p: this.params.p }
			},{
				endpoint: Aeris.endpoints.FORECASTS,
				params: $.extend(true, { limit: 2, filter: 'daynight' }, this.params)
			}], {});
		},

		_afterRender: function(data) {
			this.$('.aeris-widget-24hr-compact-period:last').addClass('aeris-widget-24hr-compact-period-last');
		}

	});


	// Forecast Widget
	Aeris.widgets.Forecast = Aeris.Widget.extend({
		prefix: 'fcst',
		defaults: {
			cls: '',
			tpl: {
				container: '<div class="aeris-widget-outer aeris-widget-fcst">' +
					'<div class="aeris-widget-inner">' +
						'<div class="aeris-widget-top">' +
							'<div class="aeris-widget-title">{{places.0.place.name}}, {{places.0.place.state}}</div>' +
							'<div class="aeris-widget-loader-update"></div>' +
							'<div class="aeris-widget-tbar">' +
								'<div class="aeris-widget-tbar-ctrls">' +
									'<a class="aeris-widget-tbar-btn aeris-widget-tbar-btn-search"></a>' +
									'<a class="aeris-widget-tbar-btn aeris-widget-tbar-btn-geolocate"></a>' +
								'</div>' +
							'</div>' +
						'</div>' +
						'{{> search}}' +
						'{{> error}}' +
						'<div class="aeris-widget-bottom">' +
							'<div class="aeris-widget-fcst-periods">' +
								'<ul>{{#forecasts.0.periods}}' +
									'<li>' +
										'<p class="aeris-widget-fcst-period-name">{{#if ../isHourly}}{{hourformat validTime}}{{else}}{{dayformat validTime}}{{/if}}</p>' +
										'<p class="aeris-widget-fcst-period-icon"><img src="{{../paths.wxicons}}{{icon}}" /></p>' +
										'{{#if ../isHourly}}' +
											'<p class="aeris-widget-fcst-period-hi">{{#if ../../metric}}{{tempC}}{{else}}{{tempF}}{{/if}}&deg;</p>' +
										'{{else}}' +
											'<p class="aeris-widget-fcst-period-hi">{{#if ../../metric}}{{maxTempC}}{{else}}{{maxTempF}}{{/if}}&deg;</p>' +
											'<p class="aeris-widget-fcst-period-lo">{{#if ../../metric}}{{minTempC}}{{else}}{{minTempF}}{{/if}}&deg;</p>' +
										'{{/if}}' +
									'</li>' +
								'{{/forecasts.0.periods}}</ul>' +
							'</div>' +
						'</div>' +
					'</div>' +
				'</div>',
				helpers: {
					dayformat: function(s) {
						var dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
						var d;
						if (typeof(s) === 'string') {
							var p = s.split(/-|\+|\s+|:|T/);
							d = new Date(p[0], p[1]-1, p[2], p[3], p[4], p[5], 0);
						}
						else {
							d = new Date(s * 1000);
						}
						return dayNames[d.getDay()].substr(0, 3);
					},
					hourformat: function(s) {
						if (typeof(s) === 'string') {
						var p = s.split(/-|\+|\s+|:|T/);
							d = new Date(p[0], p[1]-1, p[2], p[3], p[4], p[5], 0);
						}
						else {
							d = new Date(s * 1000);
						}
						var h = d.getHours();
						var ampm = (h >= 12) ? 'p' : 'a';
						if (h > 12) h -= 12;
						else if (h === 0) h = 12;

						return (h + ampm);
					},
					periodformat: function(s) {

					}
				}
			},
			opts: {
				resize: {
					col: {
						autocalc: true
					}
				}
			}
		},

		load: function() {
			if (this._geo()) return;

			this.showLoader();
			var widget = this;

			if (!this.collection) {
				this.collection = new Aeris.collections.Batch();
				this.collection.bind('load', function(collection){
					widget.hideLoader();
					widget.render(collection.toJSON().data);
				});
				this.collection.bind('loaderror', function(collection, code, error){
					widget.hideLoader();
					widget.showError(error, 2000);
				});
			}

			this.collection.fetch([{
				endpoint: Aeris.endpoints.PLACES,
				params: { p: this.params.p }
			},{
				endpoint: Aeris.endpoints.FORECASTS,
				params: $.extend(true, { limit: 7 }, this.params)
			}], {});
		},

		_beforeRender: function(data) {
			data.isHourly = false;
			data.isDayNight = false;

			if (data.params.filter) {
				data.isHourly = (data.params.filter !== 'day' && data.params.filter !== 'daynight');
				data.isDayNight = (data.params.filter !== 'daynight');
			}
		},

		_afterRender: function() {
			if (this.opts.resize.col.autocalc === false)
				return;

			// resize period rows based on overall width of content container
			var perCols = this.$('.aeris-widget-fcst-periods > ul > li');
			var maxw = this.$('.aeris-widget-inner').width();
			var w = Math.floor(maxw / perCols.length);
			var totw = cw = 0;
			if (w > 0) {
				Aeris._.each(perCols, function(col){
					var el = $(col);
					// need to account for any margins, padding or borders in column width
					cw = w - (el.outerWidth() - el.width());
					el.css({ width: cw });
					totw += el.outerWidth();
				});
			}
			// add any remaining width to last element due to rounding
			if (maxw > 0 && totw < maxw) {
				this.$('.aeris-widget-fcst-periods > ul > li:last').css({ width: cw + (maxw - totw) });
			}
		}

	});


	// Nearby Weather Widget
	Aeris.widgets.NearbyWeather = Aeris.Widget.extend({
		prefix: 'nearbywx',
		defaults: {
			cls: '',
			tpl: '<div class="aeris-widget-outer aeris-widget-nearbywx">' +
						'<div class="aeris-widget-inner">' +
						'<div class="aeris-widget-top">' +
							'<div class="aeris-widget-title">Nearby Weather</div>' +
							'<div class="aeris-widget-loader-update"></div>' +
							'{{> toolbar}}' +
						'</div>' +
						'{{> search}}' +
						'{{> error}}' +
						'<div class="aeris-widget-bottom">' +
							'<ul class="aeris-widget-nearbywx-listing">' +
								'{{#locations}}<li>' +
									'<div class="aeris-widget-nearbywx-name"><a href="{{../links.wxlocal}}?pands={{lower places.place.name}},{{#if places.place.state}}{{lower places.place.state}}{{else}}{{lower places.place.country}}{{/if}}">' +
										'{{places.place.name}}{{#if places.place.state}}, {{places.place.state}}{{/if}}' +
									'</a></div>' +
									'<div class="aeris-widget-nearbywx-temp">{{#if ../metric}}{{observations.0.ob.tempC}}{{else}}{{observations.0.ob.tempF}}{{/if}}&deg;<span class="aeris-widget-unit aeris-widget-unit-temp">{{#if ../metric}}C{{else}}F{{/if}}</span></div>' +
									'<div class="aeris-widget-nearbywx-icon"><img src="{{../paths.wxicons}}{{observations.0.ob.icon}}" /></div>' +
									'<div class="aeris-widget-nearbywx-detail">Feels Like {{#if ../metric}}{{observations.0.ob.feelslikeC}}{{else}}{{observations.0.ob.feelslikeF}}{{/if}}&deg;</div>' +
									'{{#if advisories}}<a class="aeris-widget-nearbywx-alerts" href="{{../../links.wxlocal}}local/{{lower places.place.country}}/{{lower places.place.state}}/{{lower places.place.name}}/warnings.html">' +
										'<div class="aeris-widget-nearbywx-count">{{advisories.length}}</div>' +
										'<div class="aeris-widget-nearbywx-label">active alerts</div></a>{{/if}}' +
								'</li>{{/locations}}' +
							'</ul>' +
						'</div>' +
					'</div>' +
				'</div>'
		},

		// store for the places and their data we're using
		places: [],
		placesData: [],

		setUnits: function(units) {
			if (units != this.opts.units) {
				this.opts.units = units;
				this.render({locations: this.placesData});
			}
		},

		load: function() {
			if (this._geo()) return;

			this.showLoader();
			var widget = this;

			if (!this.collection) {
				// load place first, then weather data
				this.collection = new Aeris.collections.Places();
				this.collection.bind('load', function(collection){
					widget.hideLoader();

					var locData = [];
					widget.places.length = 0;
					Aeris._.each(collection.models, function(model){
						// store loc to pass to weather loader for the request
						widget.places.push(model.get('place.name') + ',' + model.get('place.state') + ',' + model.get('place.country'));
						// setup data object to pass to template renderer for places
						locData.push({
							places: model.toJSON(),
							observations: [{
								ob: {
									icon: 'na.png'
								}
							}]
						});
					});
					widget.render({locations: locData});
					widget.placesData = locData;

					// now load weather data for the returned places
					widget._loadWxData(collection);
				});
				this.collection.bind('loaderror', function(collection, code, error){
					widget.hideLoader();
					widget.showError(error, 2000);
				});
			}

			this.collection.fetch(Aeris.actions.CLOSEST, this.params);
		},

		_loadWxData: function(placesColl) {
			var widget = this;
			// maps a batch request to a particular place index
			var batchToIndex = {};
			// stores data returned from combined places and batch requests for a single location
			locData = [];
			var c = 0;
			for (var i = 0, len = this.places.length; i < len; i++) {
				var place = this.places[i];

				var batch = new Aeris.collections.Batch();
				// use collection cid as key for this place object to reference when batch loads
				batchToIndex[batch.cid] = i;

				batch.bind('load', function(collection){
					var index = batchToIndex[collection.cid];

					//var advColl = collection.getByEndpoint(Aeris.endpoints.ADVISORIES);
					//if (advColl) advColl = advColl[0];

					var result = Aeris._.extend({}, {
						places: placesColl.at(index).toJSON()
					}, collection.toJSON().data);
					locData[index] = result;
					c++;

					// only render rows if we've received all location data
					if (c === len) {
						widget.placesData = locData;
						widget.hideLoader();
						widget.render({locations: locData});
					}
				});
				batch.bind('loaderror', function(collection, code, error){
					widget.hideLoader();
					widget.showError(error, 2000);
				});
				batch.fetch([{
					endpoint: Aeris.endpoints.OBS,
					action: Aeris.actions.ID,
					params: { p: place }
				},{
					endpoint: Aeris.endpoints.ADVISORIES,
					action: Aeris.actions.ID,
					params: { p: place }
				}], {});
			}
		}

	});


	// Advisories Widget
	Aeris.widgets.Advisories = Aeris.Widget.extend({
		prefix: 'advisories',
		defaults: {
			cls: '',
			tpl: {
				container: '<div class="aeris-widget-outer aeris-widget-advisories">' +
					'<div class="aeris-widget-inner">' +
						'<div class="aeris-widget-top">' +
							'<div class="aeris-widget-title">{{places.0.place.name}}, {{places.0.place.state}}</div>' +
							'<div class="aeris-widget-loader-update"></div>' +
							'{{> toolbar}}' +
						'</div>' +
						'{{> search}}' +
						'{{> error}}' +
						'<div class="aeris-widget-bottom">' +
							'<ul class="aeris-widget-advisories-listing">' +
							'{{#if advisories}}' +
								'{{#advisories}}<li><p class="aeris-widget-advisories-name">{{ucwords details.name}}</p>' +
									'<p class="aeris-widget-advisories-expires">expires {{dateformat timestamps.expiresISO}}</p>' +
									'<div class="aeris-widget-advisories-icon aeris-widget-advisories-icon-{{alerttype details.type}}"></div>' +
								'</li>{{/advisories}}' +
							'{{else}}' +
								'<li class="aeris-widget-error">There are currently no active advisories.</li>' +
							'{{/if}}' +
							'</ul>' +
						'</div>' +
					'</div>' +
				'</div>',
				helpers: {
					alerttype: function(s) {
						var type = 'adv';
						s += '';
						if (s.match(/\.W$/)) type = 'warn';
						else if (s.match(/\.A$/)) type = 'watch';
						return type;
					},
					dateformat: function(s) {
						var dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
						var monthNames = ['January','February','March','April','May','June','July','August','September','October','November','Decemeber'];
						var d;
						s += '';
						if (typeof(s) === 'string') {
							var p = s.split(/-|\+|\s+|:|T/);
							d = new Date(p[0], p[1]-1, p[2], p[3], p[4], p[5], 0);
						}
						else {
							d = new Date(s * 1000);
						}
						if (!d) return;

						var hr = d.getHours();
						var min = String("00000" + d.getMinutes()).slice(-2);
						var ampm = (hr >= 12) ? 'pm' : 'am';
						if (hr > 12) hr -= 12;
						if (hr === 0) hr = 12;

						var dayName = dayNames[d.getDay()] + '';
						var monthName = monthNames[d.getMonth()] + '';

						return (dayName.substr(0, 3) + ', ' + monthName.substr(0, 3) + ' ' + d.getDate() + ' at ' + hr + ':' + min + ampm);
					}
				}
			}
		},

		load: function() {
			if (this._geo()) return;

			this.showLoader();
			var widget = this;

			if (!this.collection) {
				this.collection = new Aeris.collections.Batch();
				this.collection.bind('load', function(collection){
					widget.hideLoader();
					widget.render(collection.toJSON().data);
				});
				this.collection.bind('loaderror', function(collection, code, error){
					widget.hideLoader();
					widget.showError(error, 2000);
				});
			}

			this.collection.fetch([{
				endpoint: Aeris.endpoints.PLACES,
				params: {
					p: this.params.p
				}
			},{
				endpoint: Aeris.endpoints.ADVISORIES,
				params: $.extend(true, {}, this.params)
			}], {});

		}

	});


	// Storm Reports Widget
	Aeris.widgets.StormReports = Aeris.Widget.extend({
		prefix: 'stmreports',
		defaults: {
			cls: '',
			tpl: {
				container: '<div class="aeris-widget-outer aeris-widget-stmreports">' +
						'<div class="aeris-widget-inner">' +
							'<div class="aeris-widget-top">' +
								'<div class="aeris-widget-title">{{places.0.place.name}}, {{places.0.place.state}}</div>' +
								'<div class="aeris-widget-loader-update"></div>' +
								'<div class="aeris-widget-tbar">' +
									'<div class="aeris-widget-tbar-ctrls">' +
										'<a class="aeris-widget-tbar-btn aeris-widget-tbar-btn-search"></a>' +
										'<a class="aeris-widget-tbar-btn aeris-widget-tbar-btn-geolocate"></a>' +
									'</div>' +
								'</div>' +
							'</div>' +
							'{{> search}}' +
							'{{> error}}' +
							'{{> filters}}' +
							'<div class="aeris-widget-stmreports-listing">{{#if stormreports}}' +
								'<ul>{{#stormreports}}' +
								'{{> row}}' +
								'{{/stormreports}}</ul>' +
							'{{else}}<div class="aeris-widget-error">No storm reports for the selected type found.</div>{{/if}}</div>' +
						'</div>' +
					'</div>',
				partials: {
					row: '<li>' +
							'<div class="aeris-widget-stmreports-icon aeris-widget-stmreports-icon-code-{{report.code}}"></div>' +
							'<div class="aeris-widget-stmreports-profile">' +
								'<div class="aeris-widget-stmreports-name">{{ucwords report.type}}<span class="aeris-widget-stmreports-total">{{total report.detail metric}}</span></div>' +
								'<div class="aeris-widget-stmreports-details">{{ucwords place.name}}, {{upper place.state}} - {{dateformat report.datetime}}</div>' +
							'</div>' +
						'</li>',
					filters: '<div class="aeris-widget-stmreports-ctrl">' +
							'<ul>' +
								'<li class="filter-all"><a>All</a></li>' +
								'<li class="filter-tornado"><a>Tornado</a></li>' +
								'<li class="filter-rain"><a>Rain</a></li>' +
								'<li class="filter-wind"><a>Wind</a></li>' +
								'<li class="filter-snow"><a>Snow</a></li>' +
								'<li class="filter-hail"><a>Hail</a></li>' +
								'<li class="filter-ice"><a>Ice</a></li>' +
							'</ul>' +
						'</div>'
				},
				helpers: {
					total: function(s, metric) {
						var v = '';
						s = s || {};
						if (s.snowIN) v = s.snowIN + '"';
						else if (s.rainIN) v = s.rainIN + '"';
						else if (s.windSpeedMPH) v = s.windSpeedMPH + ' mph';
						return ((v !== '') ? ' - ' + v : '');
					},
					dateformat: function(s) {
						var d;
						s += '';
						if (typeof(s) === 'string') {
							var p = s.split(/-|\+|\s+|:|T/);
							d = new Date(p[0], p[1]-1, p[2], p[3], p[4], p[5], 0);
						}
						else {
							d = new Date(s * 1000);
						}
						var y = d.getFullYear();
						var m = d.getMonth();
						var dt = d.getDate();
						var h = d.getHours();
						var mn = d.getMinutes();

						var ampm = (h >= 12) ? 'pm' : 'am';
						h = (h > 12) ? h - 12 : ((h === 0) ? 12 : h);
						mn = (mn < 10) ? '0' + mn : mn;

						return ((m + 1) + '/' + dt + '/' + y + ' at ' + h + ':' + mn + ampm);
					}
				}
			},
			updates: {
				target: '.aeris-widget-stmreports-listing'
			},
			params: {
				limit: 50
			}
		},

		load: function() {
			if (this._geo()) return;

			this.showLoader();
			var widget = this;

			if (!this.collection) {
				this.collection = new Aeris.collections.Batch();
				this.collection.bind('load', function(collection){
					widget.hideLoader();
					widget.render(collection.toJSON().data);
				});
				this.collection.bind('loaderror', function(collection, code, error){
					widget.hideLoader();
					widget.showError(error, 2000);
				});
			}

			this.collection.fetch([{
				endpoint: Aeris.endpoints.PLACES,
				params: {
					p: this.params.p
				}
			},{
				endpoint: Aeris.endpoints.STMREPORTS,
				action: Aeris.actions.CLOSEST,
				params: $.extend(true, { limit: 50 }, this.params)
			}], {});
		},

		filter: function(code) {
			this.$('.aeris-widget-stmreports-ctrl li').removeClass('sel');
			this.$('.aeris-widget-stmreports-ctrl li.filter-' + code).addClass('sel');
			this.params.filter = (code != 'all') ? code : null;
			this.collection.reset();
			this.load();
		},

		_afterRender: function(data) {
			var widget = this;

			// select default filter
			var filter = this.params.filter || 'all';
			this.$('.aeris-widget-stmreports-ctrl li.filter-' + filter).addClass('sel');

			// filter control events
			this.$('.aeris-widget-stmreports-ctrl li').click(function(e){
				var el = e.currentTarget;
				var filter = $(el).attr('class').replace(/^filter-(\w+)( sel)?$/, "$1");
				widget.filter(filter);
			});
		},

		_afterUpdate: function(data) {
			// update location title
			var html = this.view.snippet('.aeris-widget-title');
			var tpl = Handlebars.compile(html);
			var val = tpl(data);
			var title = this.$('.aeris-widget-title');
			// only update if not the same
			if (title.html() != val) {
				title.fadeOut(100, function(){
					title.html(tpl(data));
					title.fadeIn(100);
				});
			}
		}

	});

	// Temperature Extremes Widget
	Aeris.widgets.TempExtremes = Aeris.Widget.extend({
		prefix: 'currents-compact',
		defaults: {
			cls: '',
			tpl: {
				container: '<div class="aeris-widget-outer aeris-widget-tempextremes">' +
					'<div class="aeris-widget-inner">' +
						'<div class="aeris-widget-top">' +
							'<div class="aeris-widget-title">{{ucwords countries.0.place.name}}</div>' +
							'<div class="aeris-widget-loader-update"></div>' +
							'{{> toolbar}}' +
						'</div>' +
						'{{> search}}' +
						'{{> error}}' +
						'<div class="aeris-widget-bottom">' +
							'<ul>' +
								'<li class="aeris-widget-tempextremes-max">' +
									'<div class="aeris-widget-tempextremes-label">Highest Temp</div>' +
									'<div class="aeris-widget-tempextremes-icon"></div>' +
									'<div class="aeris-widget-tempextremes-profile">' +
									'{{#if observations.0.ob}}' +
										'<div class="aeris-widget-tempextremes-val">{{#if metric}}{{observations.0.ob.tempC}}{{else}}{{observations.0.ob.tempF}}{{/if}}&deg;<span class="aeris-widget-unit aeris-widget-unit-temp">{{#if metric}}C{{else}}F{{/if}}</span></div>' +
										'<div class="aeris-widget-tempextremes-name">{{ucwords observations.0.place.name}}}{{#if observations.0.place.state}}, {{upper observations.0.place.state}}{{/if}}</div>' +
									'{{else}}' +
										'<div class="aeris-widget-tempextremes-error">No observation found.</div>' +
									'{{/if}}' +
									'</div>' +
								'</li>' +
								'<li class="aeris-widget-tempextremes-min">' +
									'<div class="aeris-widget-tempextremes-label">Lowest Temp</div>' +
									'<div class="aeris-widget-tempextremes-icon"></div>' +
									'<div class="aeris-widget-tempextremes-profile">' +
									'{{#if observations.1.ob}}' +
										'<div class="aeris-widget-tempextremes-val">{{#if metric}}{{observations.1.ob.tempC}}{{else}}{{observations.1.ob.tempF}}{{/if}}&deg;<span class="aeris-widget-unit aeris-widget-unit-temp">{{#if metric}}C{{else}}F{{/if}}</span></div>' +
										'<div class="aeris-widget-tempextremes-name">{{ucwords observations.1.place.name}}{{#if observations.1.place.state}}, {{upper observations.1.place.state}}{{/if}}</div>' +
									'{{else}}' +
										'<div class="aeris-widget-tempextremes-error">No observation found.</div>' +
									'{{/if}}' +
									'</div>' +
								'</li>' +
							'</ul>' +
						'</div>' +
					'</div>' +
				'</div>',
				partials: {
					search: '<div class="aeris-widget-search">' +
							'<label>Country</label><input type="text" name="aeris-tempextremes-search" />' +
						'</div>'
				},
				helpers: {
					ucwords: function(s) {
						s = (s + '').toLowerCase();
						s = s.replace(/,.+$/, '');
						return (s + '').replace(/^([a-z])|\s+([a-z])|\/([a-z])|(\-[a-z])/g, function($1) {
							return $1.toUpperCase();
						});
					}
				}
			},
			opts: {
				country: 'us',
				toolbar: {
					geolocate: false
				}
			}
		},

		load: function() {
			this.showLoader();
			var widget = this;

			var query = 'country:' + this.opts.country;
			//if (this.params.state) query += ',state:' + this.params.state;
			if (this.params.query) query += this.params.query;

			if (!this.collection) {
				this.collection = new Aeris.collections.Batch();
				this.collection.bind('load', function(collection){
					widget.hideLoader();
					widget.render(collection.toJSON().data);
				});
				this.collection.bind('loaderror', function(collection, code, error){
					widget.hideLoader();
					widget.showError(error, 2000);
				});
				this.collection.bind('collectionerror', function(collection){

				});
			}

			this.collection.fetch([{
				endpoint: Aeris.endpoints.OBS,
				action: Aeris.actions.SEARCH,
				params: {
					sort: 'temp:-1',
					limit: 1,
					query: query + ',temp:-999'
				}
			},{
				endpoint: Aeris.endpoints.OBS,
				action: Aeris.actions.SEARCH,
				params: {
					sort: 'temp',
					limit: 1,
					query: query + ',temp:-999'
				}
			},{
				endpoint: Aeris.endpoints.COUNTRIES,
				params: {
					p: this.opts.country
				}
			}], {});
		},

		_afterRender: function(data) {
			var widget = this;
			var w = this.$('.aeris-widget-bottom > ul > li').width();
			var iw = this.$('.aeris-widget-bottom > ul > li .aeris-widget-tempextremes-icon').outerWidth(true);
			this.$('.aeris-widget-bottom > ul > li .aeris-widget-tempextremes-profile').width(w - iw);

			// add autocomplete if we're allowing searching
			if (this.$('.aeris-widget-search').is('*')) {
				// create countries collection to perform the requests
				var collection = new Aeris.collections.Countries();
				this.$('.aeris-widget-search input').autocomplete({
					source: function(request, response) {
						collection.fetch(Aeris.actions.SEARCH, {
							query: 'name:^' + request.term + ';iso:' + request.term + ';iso3:' + request.term,
							limit: 10
						});
						collection.bind('load', function(collection){
							response($.map(collection.toJSON().models, function(item){
								return {
									label: item.place.name,
									value: item.place.iso
								};
							}));
						});
					},
					minLength: 2,
					appendTo: this.content,
					select: function(e, ui){
						if (ui.item) {
							widget.$('.aeris-widget-search input').val(ui.item.label);
							widget.opts.country = ui.item.value;
							widget.reload();
						}
					}
				});
			}
		}

	});


	// Records Widget
	Aeris.widgets.Records = Aeris.Widget.extend({
		prefix: 'records',
		defaults: {
			cls: '',
			tpl: {
				container: '<div class="aeris-widget-outer aeris-widget-records">' +
						'<div class="aeris-widget-inner">' +
							'<div class="aeris-widget-top">' +
								'<div class="aeris-widget-title">{{places.0.place.name}}, {{places.0.place.state}}</div>' +
								'<div class="aeris-widget-loader-update"></div>' +
								'<div class="aeris-widget-tbar">' +
									'<div class="aeris-widget-tbar-ctrls">' +
										'<a class="aeris-widget-tbar-btn aeris-widget-tbar-btn-search"></a>' +
										'<a class="aeris-widget-tbar-btn aeris-widget-tbar-btn-geolocate"></a>' +
									'</div>' +
								'</div>' +
							'</div>' +
							'{{> search}}' +
							'{{> error}}' +
							'{{> filters}}' +
							'<div class="aeris-widget-records-listing">{{#if records}}' +
								'<ul>{{#records}}' +
								'{{> row}}' +
								'{{/records}}</ul>' +
							'{{else}}<div class="aeris-widget-error">No records for the selected type found.</div>{{/if}}</div>' +
						'</div>' +
					'</div>',
				partials: {
					row: '<li>' +
							'<div class="aeris-widget-records-icon aeris-widget-records-icon-type-{{report.type}}"></div>' +
							'<div class="aeris-widget-records-profile">' +
								'<div class="aeris-widget-records-name">{{typename report.type}}<span class="aeris-widget-records-total">{{total this this.metric}}</span></div>' +
								'<div class="aeris-widget-records-details">{{ucwords place.name}}, {{upper place.state}} - {{dateformat report.timestamp}}</div>' +
							'</div>' +
						'</li>',
					filters: '<div class="aeris-widget-records-ctrl">' +
							'<ul>' +
								'<li class="filter-all"><a>All</a></li>' +
								'<li class="filter-prcp"><a>Precip</a></li>' +
								'<li class="filter-snow"><a>Snow</a></li>' +
								'<li class="filter-maxt"><a>High</a></li>' +
								'<li class="filter-mint"><a>Low</a></li>' +
								'<li class="filter-lomx"><a>Cool High</a></li>' +
								'<li class="filter-himn"><a>Warm Low</a></li>' +
							'</ul>' +
						'</div>'
				},
				helpers: {
					typename: function(s) {
						var n = '';
						if (s == 'maxt') n = 'High Temp';
						else if (s == 'mint') n = 'Low Temp';
						else if (s == 'prcp') n = 'Precip';
						else if (s == 'snow') n = 'Snow';
						else if (s == 'lomx') n = 'Cool High Temp';
						else if (s == 'himn') n = 'Warm Low Temp';
						else n = s;
						return n;
					},
					total: function(s, metric) {
						var v = '';
						s = s || {};
						if (s.report && s.report.details) {
							s = s.report.details;
							if (undefined !== s.snowIN) v = s.snowIN + '"';
							else if (undefined !== s.rainIN) v = s.rainIN + '"';
							else if (undefined !== s.tempF) v = s.tempF + '&deg;F';
						}
						return ((v !== '') ? ' - ' + v : '');
					},
					dateformat: function(s) {
						var d;
						s += '';
						if (typeof(s) === 'string' && s.indexOf(':') > -1) {
							var p = s.split(/-|\+|\s+|:|T/);
							d = new Date(p[0], p[1]-1, p[2], p[3], p[4], p[5], 0);
						}
						else {
							d = new Date(s * 1000);
						}
						var y = d.getFullYear();
						var m = d.getMonth();
						var dt = d.getDate();
						return ((m + 1) + '/' + dt + '/' + y);
					}
				}
			},
			updates: {
				target: '.aeris-widget-records-listing'
			},
			params: {
				limit: 50
			}
		},

		load: function() {
			if (this._geo()) return;

			this.showLoader();
			var widget = this;

			if (!this.collection) {
				this.collection = new Aeris.collections.Batch();
				this.collection.bind('load', function(collection){
					widget.hideLoader();
					widget.render(collection.toJSON().data);
				});
				this.collection.bind('loaderror', function(collection, code, error){
					widget.hideLoader();
					widget.showError(error, 2000);
				});
			}

			this.collection.fetch([{
				endpoint: Aeris.endpoints.PLACES,
				params: {
					p: this.params.p
				}
			},{
				endpoint: Aeris.endpoints.RECORDS,
				action: Aeris.actions.CLOSEST,
				params: this.params
			}], {});
		},

		filter: function(code) {
			this.$('.aeris-widget-records-ctrl li').removeClass('sel');
			this.$('.aeris-widget-records-ctrl li.filter-' + code).addClass('sel');
			this.params.filter = (code != 'all') ? code : null;
			this.collection.reset();
			this.load();
		},

		_afterRender: function(data) {
			var widget = this;

			// select default filter
			var filter = this.params.filter || 'all';
			this.$('.aeris-widget-records-ctrl li.filter-' + filter).addClass('sel');

			// filter control events
			this.$('.aeris-widget-records-ctrl li').click(function(e){
				var el = e.currentTarget;
				var filter = $(el).attr('class').replace(/^filter-(\w+)( sel)?$/, "$1");
				widget.filter(filter);
			});
		},

		_afterUpdate: function(data) {
			// update location title
			var html = this.view.snippet('.aeris-widget-title');
			var tpl = Handlebars.compile(html);
			var val = tpl(data);
			var title = this.$('.aeris-widget-title');
			// only update if not the same
			if (title.html() != val) {
				title.fadeOut(100, function(){
					title.html(tpl(data));
					title.fadeIn(100);
				});
			}
		}

	});

}).call(this);