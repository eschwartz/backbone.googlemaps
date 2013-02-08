/**
 * Backbone.GoogleMaps
 * A Backbone JS layer for the GoogleMaps API
 * Copyright (c)2012 Edan Schwartz
 * Distributed under MIT license
 * https://github.com/eschwartz/backbone.googlemaps
*/
Backbone.GoogleMaps = (function(Backbone, _, $){
	var GoogleMaps = {};

	/**
	 * GoogleMaps.Location
	 * --------------------
	 * Representing a lat/lng location on a map
	*/
	GoogleMaps.Location = Backbone.Model.extend({
		constructor: function() {
			_.bindAll(this, 'select', 'deselect', 'toggleSelect', 'getLatlng');

			this.defaults = _.extend({}, this.defaults, {
				lat				: 0,
				lng				: 0,
				selected	: false,
				title			: ""
			});

			Backbone.Model.prototype.constructor.apply(this, arguments);
		},

		select: function() {
			if(!this.get("selected")) {
				this.set("selected", true);
				this.trigger('selected', this);
			}
		},

		deselect: function() {
			if(this.get("selected")) {
				this.set("selected", false);
				this.trigger('deselected', this);
			}
		},

		toggleSelect: function() {
			if(this.get("selected")) {
				this.deselect();
			}
			else {
				this.select();
			}
		},

		getLatlng: function() {
			return new google.maps.LatLng(this.get("lat"), this.get("lng"));
		}
	});

	/**
	 * GoogleMaps.LocationCollection
	 * ------------------------------
	 * A collection of map locations
	*/
	GoogleMaps.LocationCollection = Backbone.Collection.extend({
		model: GoogleMaps.Location,

		constructor: function() {
			Backbone.Collection.prototype.constructor.apply(this, arguments);

			// Deselect other models on model select
			// ie. Only a single model can be selected in a collection
			this.on("selected", function(selectedModel) {
				this.each(function(model) {
					if(selectedModel.cid !== model.cid) { model.deselect(); }
				});
			}, this);
		}
	});


	/**
	 * GoogleMaps.MapView
	 * ------------------
	 * Base maps overlay view from which all other overlay views extend
	*/
	GoogleMaps.MapView = Backbone.View.extend({
		// Hash of Google Map events
		// Events will be attached to this.gOverlay (google map or overlay)
		// eg `zoom_changed': 'handleZoomChange'
		mapEvents: {},

		overlayOptions: {},

		constructor: function() {
			Backbone.View.prototype.constructor.apply(this, arguments);

			// Ensure map and API loaded
			if(!google || !google.maps) throw new Error("Google maps API is not loaded.");
			if(!this.options.map && !this.map) throw new Error("A map must be specified.");
			this.gOverlay = this.map = this.options.map || this.map;

			// Set this.overlay options
			this.overlayOptions || (this.overlayOptions = this.options.overlayOptions);
		},

		// Attach listeners to the this.gOverlay
		// From the `mapEvents` hash
		bindMapEvents: function(mapEvents) {
			mapEvents || (mapEvents = this.mapEvents);

			for(event in this.mapEvents) {
				var handler = this.mapEvents[event];
				google.maps.event.addListener(this.gOverlay, event, this[handler]);
			}
		},

		render: function() {
			if(this.beforeRender) { this.beforeRender(); }
			this.bindMapEvents();
			if(this.onRender) { this.onRender(); }
		},

		// Clean up view
		// Remove overlay from map and remove event listeners
		close: function() {
			if(this.beforeClose) { this.beforeClose(); }
			google.maps.event.clearInstanceListeners(this.gOverlay);
			this.gOverlay.setMap(null);
			this.gOverlay = null;
		}
	});

	/**
	 * GoogleMaps.InfoWindow
	 * ---------------------
	 * View controller for a google.maps.InfoWindow overlay instance
	*/
	GoogleMaps.InfoWindow = GoogleMaps.MapView.extend({
		constructor: function() {
			GoogleMaps.MapView.prototype.constructor.apply(this, arguments);

			_.bindAll(this, 'render', 'close');

			// Require a related marker instance
			if(!this.options.marker && !this.marker) throw new Error("A marker must be specified for InfoWindow view.");
			this.marker = this.options.marker || this.marker;

			// Set InfoWindow template
			this.template = this.template || this.options.template;

		},

		// Render
		render: function() {
			if(this.beforeRender) { this.beforeRender(); }
			GoogleMaps.MapView.prototype.render.apply(this, arguments);

			// Render element
			var tmpl = (this.template)? $(this.template).html(): '<h2><%=title %></h2>';
			this.$el.html(_.template(tmpl, this.model.toJSON()));

			// Create InfoWindow
			this.gOverlay = new google.maps.InfoWindow(_.extend({
				content: this.$el[0]
			}, this.overlayOptions));

			// Display InfoWindow on map
			this.gOverlay.open(this.map, this.marker);

			if(this.onRender) { this.onRender(); }

			return this;
		},

		// Close and delete window, and clean up view
		close: function() {
			if(this.beforeClose) { this.beforeClose(); }

			GoogleMaps.MapView.prototype.close.apply(this, arguments);

			if(this.onClose) { this.onClose(); }

			return this;
		}
	});


	/**
	 * GoogleMaps.MarkerView
	 * ---------------------
	 * View controller for a marker overlay
	*/
	GoogleMaps.MarkerView = GoogleMaps.MapView.extend({
		// Set associated InfoWindow view
		infoWindow: GoogleMaps.InfoWindow,

		constructor: function() {
			GoogleMaps.MapView.prototype.constructor.apply(this, arguments);

			_.bindAll(this, 'render', 'close', 'openDetail', 'closeDetail', 'toggleSelect');

			// Ensure model
			if(!this.model) throw new Error("A model must be specified for a MarkerView");

			// Instantiate marker, with user defined properties
			this.gOverlay = new google.maps.Marker(_.extend({
				position: this.model.getLatlng(),
				map: this.map,
				title: this.model.title,
				animation: google.maps.Animation.DROP,
				visible: false										// hide, until render
			}, this.overlayOptions));

			// Add default mapEvents
			_.extend(this.mapEvents, {
				'click'	: 'toggleSelect'							// Select model on marker click
			});

			// Show detail view on model select
			this.model.on("selected", this.openDetail, this);
			this.model.on("deselected", this.closeDetail, this);
		},

		toggleSelect: function() {
			this.model.toggleSelect();
		},

		// Show the google maps marker overlay
		render: function() {
			if(this.beforeRender) { this.beforeRender(); }

			GoogleMaps.MapView.prototype.render.apply(this, arguments);
			this.gOverlay.setVisible(true);

			if(this.onRender) { this.onRender(); }

			return this;
		},

		close: function() {
			if(this.beforeClose) { this.beforeClose(); }
			this.closeDetail();
			GoogleMaps.MapView.prototype.close.apply(this, arguments);

			if(this.onClose) { this.onClose() }

			return this;
		},

		openDetail: function() {
			this.detailView = new this.infoWindow({
				model: this.model,
				map: this.options.map,
				marker: this.gOverlay
			});
			this.detailView.render();
		},

		closeDetail: function() {
			if(this.detailView) {
				this.detailView.close();
				this.detailView = null;
			}
		}
	});


	/**
	 * GoogleMaps.MarkerCollectionView
	 * -------------------------------
	 * Collection of MarkerViews
	*/
	GoogleMaps.MarkerCollectionView = Backbone.View.extend({
		markerView: GoogleMaps.MarkerView,

		markerViewChildren: {},

		constructor: function() {
			Backbone.View.prototype.constructor.apply(this, arguments);

			_.bindAll(this, 'render', 'closeChildren', 'closeChild', 'addChild', 'refresh', 'close');

			// Ensure map property
			if(!this.options.map && !this.map) throw new Error("A map must be specified on MarkerCollectionView instantiation");
			this.map || (this.map = this.options.map);

			// Bind to collection
			this.collection.on("reset", this.refresh, this);
			this.collection.on("add", this.addChild, this);
			this.collection.on("remove", this.closeChild, this);
		},

		// Render MarkerViews for all models in collection
		render: function(collection) {
			var collection = collection || this.collection;

			// Create marker views for each model
			collection.each(this.addChild);
		},

		// Close all child MarkerViews
		closeChildren: function() {
			for(cid in this.markerViewChildren) {
				this.closeChild(this.markerViewChildren[cid]);
			}
		},

		closeChild: function(child) {
			// Param can be child's model, or child view itself
			var childView = (child instanceof Backbone.Model)? this.markerViewChildren[child.cid]: child;

			childView.close();
			delete this.markerViewChildren[childView.model.cid];
		},

		// Add a MarkerView and render
		addChild: function(childModel) {
			var markerView = new this.markerView({
				model: childModel,
				map: this.map,
			});

			this.markerViewChildren[childModel.cid] = markerView;

			markerView.render();
		},

		refresh: function() {
			this.closeChildren();
			this.render();
		},

		// Close all child MarkerViews
		close: function() {
			this.closeChildren();
		}
	})


	return GoogleMaps;
})(Backbone, _, window.jQuery || window.Zepto || window.ender);
