/*!
 * Backbone.GoogleMaps
 * A Backbone JS layer for the GoogleMaps API
 * Copyright (c)2012 Edan Schwartz
 * Distributed under MIT license
 * https://github.com/eschwartz/backbone.googlemaps
 */
(function(root, factory) {
  if(typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['backbone', 'underscore', 'jquery'], factory);
  }
  else {
    // Browser globals
    factory(root.Backbone, root._, root.jQuery || root.Zepto || root.ender);
  }
}(this, function(Backbone, _, $) {

  'use strict';

  var GoogleMaps = {};

  /**
   * GoogleMaps.Location
   * --------------------
   * Representing a lat/lng location on a map
   */
  GoogleMaps.Location = Backbone.Model.extend({
    constructor: function() {
      _.bindAll(this, 'select', 'deselect', 'toggleSelect', 'getLatLng');

      this.defaults = _.extend({}, {
        lat: 0,
        lng: 0,
        selected: false,
        title: ""
      }, this.defaults);

      Backbone.Model.prototype.constructor.apply(this, arguments);

      // Trigger 'selected' and 'deselected' events
      this.on("change:selected", function(model, isSelected) {
        console.log("EVENT  change:selected in Location");
        var topic = isSelected ? "selected" : "deselected";
        this.trigger(topic, this);
      }, this);
    },

    select: function() {
      console.log("  Location->selected");
      this.set("selected", true);
    },

    deselect: function() {
      console.log("  Location->deselected");
      this.set("selected", false);
    },

    toggleSelect: function() {
      console.log("  Location->toggleSelect");
      this.set("selected", !this.get("selected"));
    },

    getLatLng: function() {
      console.log("Location->getLatLng job");
      return new L.LatLng(this.get("lat"), this.get("lng"));
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
      this.on("change:selected", function(selectedModel, isSelected) {
        console.log("EVENT  change:selected in LocationCollection");
        if (isSelected) {
          this.each(function(model) {
            if(selectedModel.cid !== model.cid) { model.deselect(); }
          });
        }
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

    constructor: function(options) {
      _.bindAll(this, 'render', 'close');

      Backbone.View.prototype.constructor.apply(this, arguments);

      // Ensure map API loaded
      if(!L) throw new Error("Leaflet Library is not loaded.");
      if(!options.map && !this.map) throw new Error("A map must be specified.");
      this.gOverlay = this.map = options.map || this.map;

      // Set this.overlay options
      this.overlayOptions || (this.overlayOptions = options.overlayOptions);
    },

    // Attach listeners to the this.gOverlay
    // From the `mapEvents` hash
    bindMapEvents: function(mapEvents) {
      console.log("MapView->bindMapEvents");
      mapEvents || (mapEvents = this.mapEvents);

      for(var event in mapEvents) {
        var handler = mapEvents[event];
        _.bindAll(this, handler);
        this.gOverlay.addEventListener(event, this[handler]);
      }

    },

    render: function() {
      this.trigger('before:render');
      if(this.beforeRender) { this.beforeRender(); }
      this.bindMapEvents();

      this.trigger('render');
      if(this.onRender) { this.onRender(); }

      return this;
    },

    // Clean up view
    // Remove overlay from map and remove event listeners
    close: function() {
      this.trigger('before:close');
      if(this.beforeClose) { this.beforeClose(); }

      this.gOverlay.clearAllEventListeners();
      this.map.removeLayer(this.gOverlay);
      this.gOverlay = null;

      this.trigger('close');
      if(this.onClose) { this.onClose(); }
    }
  });

  /**
   * GoogleMaps.InfoWindow
   * ---------------------
   * View controller for a google.maps.InfoWindow overlay instance
   */
  GoogleMaps.InfoWindow = GoogleMaps.MapView.extend({
    constructor: function(options) {
      GoogleMaps.MapView.prototype.constructor.apply(this, arguments);

      _.bindAll(this, 'render', 'close');

      // Require a related marker instance
      if(!options.marker && !this.marker) throw new Error("A marker must be specified for InfoWindow view.");
      this.marker = options.marker || this.marker;

      // Set InfoWindow template
      this.template = this.template || options.template;

    },

    // Render
    render: function() {
      this.trigger('before:render');
      if(this.beforeRender) { this.beforeRender(); }

      GoogleMaps.MapView.prototype.render.apply(this, arguments);

      // Render element
      var tmpl = (this.template)? $(this.template).html(): '<h2><%=title %></h2>';
      this.$el.html(_.template(tmpl, this.model.toJSON()));

      // Create InfoWindow
      this.gOverlay = new L.popup(this.overlayOptions);
      this.gOverlay.setContent(this.$el[0]);

      // Display InfoWindow on map
      this.marker.bindPopup(this.$el[0]).openPopup();

      this.trigger('render');
      if(this.onRender) { this.onRender(); }

      return this;
    },

    // Close and delete window, and clean up view
    close: function() {
      this.trigger('before:close');
      if(this.beforeClose) { this.beforeClose(); }

      GoogleMaps.MapView.prototype.close.apply(this, arguments);

      this.trigger('close');
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
      this.gOverlay = new L.Marker(this.model.getLatLng(), _.extend({
        title: this.model.title,
        animation: google.maps.Animation.DROP,
        visible: false // hide, until render
      }, this.overlayOptions));

      this.gOverlay.addTo(this.map);

      // Add default mapEvents
      _.extend(this.mapEvents, {
        'click': 'toggleSelect' // Select model on marker click
      });

      // Show detail view on model select
      this.model.on("change:selected", function(model, isSelected) {
        if (isSelected) {
          this.openDetail();
        }
        else {
          this.closeDetail();
        }
      }, this);
      this.model.on("change:lat change:lng", this.refreshOverlay, this);

      // Sync location model lat/lng with marker position
      this.bindMapEvents({
        'move': 'updateModelPosition'
      });
    },

    // update overlay position if lat or lng change
    refreshOverlay: function() {
      // Only update overlay if we're not already in sync
      // Otherwise we end up in an endless loop of
      // update model <--eventhandler--> update overlay
      if(!this.model.getLatLng().equals(this.gOverlay.getLatLng())) {
        this.gOverlay.setOptions({
          position: this.model.getLatLng()
        });
      }
    },

    updateModelPosition: function() {
      console.log("EVENT  MarkerView->updateModelPosition");
      var newPosition = this.gOverlay.getLatLng();

      // Only update model if we're not already in sync
      // Otherwise we end up in an endless loop of
      // update model <--eventhandler--> update overlay
      if(!this.model.getLatLng().equals(newPosition)) {
        this.model.set({
          lat: newPosition.lat,
          lng: newPosition.lng
        });
      }
    },

    toggleSelect: function() {
      this.model.toggleSelect();
    },

    // Show the google maps marker overlay
    render: function() {
      console.log("MarkerView->render");
      this.trigger('before:render');
      if(this.beforeRender) { this.beforeRender(); }

      GoogleMaps.MapView.prototype.render.apply(this, arguments);
      // this.gOverlay.setVisible(true);

      this.trigger('render');
      if(this.onRender) { this.onRender(); }

      return this;
    },

    close: function() {
      console.log("MarkerView->close");
      this.trigger('before:close');
      if(this.beforeClose) { this.beforeClose(); }

      this.closeDetail();
      GoogleMaps.MapView.prototype.close.apply(this, arguments);
      this.model.off();

      this.trigger('close');
      if(this.onClose) { this.onClose() }

      return this;
    },

    openDetail: function() {
      this.detailView = new this.infoWindow({
        model: this.model,
        map: this.map,
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

  GoogleMaps.RichMarkerView = GoogleMaps.MarkerView.extend({
    constructor: function() {
      GoogleMaps.MarkerView.prototype.constructor.apply(this, arguments);

      // Instantiate marker, with user defined properties
      this.gOverlay = new RichMarker(_.extend({
        position: this.model.getLatLng(),
        map: this.map,
        content: "",
        title: this.model.title,
        animation: google.maps.Animation.DROP,
        visible: false // hide, until render
      }, this.overlayOptions));
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

    constructor: function(options) {
      Backbone.View.prototype.constructor.apply(this, arguments);

      _.bindAll(this, 'render', 'closeChildren', 'closeChild', 'addChild', 'refresh', 'close');

      // Ensure map property
      if(!options.map && !this.map) throw new Error("A map must be specified on MarkerCollectionView instantiation");
      this.map || (this.map = options.map);

      // Bind to collection
      this.collection.on("reset", this.refresh, this);
      this.collection.on("add", this.addChild, this);
      this.collection.on("remove", this.closeChild, this);
    },

    // Render MarkerViews for all models in collection
    render: function(collection) {
      console.log("MarkerCollectionView->render");
      var collection = collection || this.collection;

      this.trigger('before:render');
      if(this.beforeRender) { this.beforeRender(); }

      // Create marker views for each model
      collection.each(this.addChild);

      this.trigger('render');
      if(this.onRender) { this.onRender(); }

      return this;
    },

    // Close all child MarkerViews
    closeChildren: function() {
      console.log("MarkerCollectionView->closeChildren");
      for(var cid in this.markerViewChildren) {
        this.closeChild(this.markerViewChildren[cid]);
      }
    },

    closeChild: function(child) {
      console.log("MarkerCollectionView->closeChild");
      // Param can be child's model, or child view itself
      var childView = (child instanceof Backbone.Model)? this.markerViewChildren[child.cid]: child;

      childView.close();
      delete this.markerViewChildren[childView.model.cid];
    },

    // Add a MarkerView and render
    addChild: function(childModel) {
      console.log("MarkerCollectionView->addChild");
      var markerView = new this.markerView({
        model: childModel,
        map: this.map
      });

      this.markerViewChildren[childModel.cid] = markerView;

      markerView.render();
    },

    refresh: function() {
      console.log("MarkerCollectionView->refresh");
      this.closeChildren();
      this.render();
    },

    // Close all child MarkerViews
    close: function() {
      console.log("MarkerCollectionView->close");
      this.closeChildren();
      this.collection.off();
    }
  });

  Backbone.GoogleMaps = GoogleMaps;
  return GoogleMaps;
}));

