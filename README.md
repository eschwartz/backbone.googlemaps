Backbone.GoogleMaps
===================

A Backbone JS extension for interacting with the Google Maps API (v3.10)

### A note regarding the future of Backbone.GoogleMaps

I am currently working on a **Backbone.Maps v2.0** update to the libary with better separation of concerns, support for multiple mapping APIs, expanded overlay view support, and (_shocking_) unit tests. 

I apologize for my slow response to pull requests. One of the reasons I've been slow to respond to pull requests is that I haven't been able to run tests to check that new and existing functionality is functional. (A full-time job and a toddler at home might have something to do with my slow response, too, now that I think of it.)

I am glad so many people have found this library useful. If you are interested in supporting the transition to v2.0, **I would love to find some collaborators to help me kickstart the project.** You can find my contact info in [my user profile](https://github.com/eschwartz)


## About backbone.googlemaps

Backbone.GoogleMaps is a simple Backbone JS extension for simplified interactions with the Google Maps API. The motivation for creating this extension was to have an easy way to sync data about maps locations from a database with the Google Maps UI, using Backbone's RESTful interface.

## Example

View the files in the example directory for working samples. Don't forget to add your Google Maps API key:

```
<script type="text/javascript" src="https://maps.googleapis.com/maps/api/js?key=[YOUR_API_KEY]&sensor=false"></script>
```

A simple example:

```javascript
// Create Google map instance
var places = new Backbone.GoogleMaps.LocationCollection([
	{
		title: "Walker Art Center",
		lat: 44.9796635,
		lng: -93.2748776
	},
	{
		title: "Science Museum of Minnesota",
		lat: 44.9429618,
		lng: -93.0981016
	}
]);

var map = new google.maps.Map($('#map_canvas')[0], {
	center: new google.maps.LatLng(44.9796635, -93.2748776),
	zoom: 12,
	mapTypeId: google.maps.MapTypeId.ROADMAP
});

// Render Markers
var markerCollectionView = new Backbone.GoogleMaps.MarkerCollectionView({
	collection: places,
	map: map
});
markerCollectionView.render();
```

## Backbone.GoogleMaps Components

Backbone.GoogleMaps is packaged with several customizable components.

### GoogleMaps.Location
Represents a lat/lng location on a map. Extends Backbone.Model.

#### Properties
<table>
	<tr>
		<td>Property</td><td>Default Value</td><td>Description</td>
	</tr>
	<tr>
		<td>lat</td>
		<td>0</td>
		<td>The location's latitude</td>
	</tr>
	<tr>
		<td>lng</td>
		<td>0</td>
		<td>The location's longitute</td>
	</tr>
	<tr>
		<td>selected</td>
		<td>false</td>
		<td>A flag for selecting a location</td>
	</tr>
	<tr>
		<td>title</td>
		<td>""</td>
		<td>Location title</td>
	</tr>
</table>

#### Methods
<table>
	<tr>
		<td>Method</td>
		<td>Parameters</td>
		<td>Return Value</td>
		<td>Description</td>
	</tr>
	<tr>
		<td>select</td>
		<td></td>
		<td></td>
		<td>Sets the model's selected property as true. Triggers a "selected" event on the model.</td>
	</tr>
	<tr>
		<td>deselect</td>
		<td></td>
		<td></td>
		<td>Sets the model's selected property as false. Triggers a "deselected" event on the model.</td>
	</tr>
	<tr>
		<td>toggleSelect</td>
		<td></td>
		<td></td>
		<td>Toggles the model's selected property.</td>
	</tr>
	<tr>
		<td>getLatLng</td>
		<td></td>
		<td>google.maps.LatLng instance</td>
		<td>Returns the latitude and longitude of the model</td>
	</tr>
</table>

### GoogleMaps.LocationCollection

A collection of GoogleMaps.Location objects. Extends Backbone.Collection.

Only a single `Location` model can be selected in a given `LocationCollection` at any time.

### GoogleMaps.MapView

A generic GoogleMaps view, for controlling a maps overlay instance. Extends Backbone.View.

#### Properties
<table>
	<tr>
		<td>Property</td>
		<td>Default Value</td>
		<td>Description</td>
	</tr>
	<tr>
		<td>map</td>
		<td></td>
		<td>The google.maps.Map instance to which the overlay is attached</td>
	</tr>
	<tr>
		<td>mapEvents</td>
		<td>{}</td>
		<td>Hash of Google Map events. Events are attached to this.gOverlay (google map or overlay)</td>
	</tr>
	<tr>
		<td>gOverlay</td>
		<td>this.map</td>
		<td>The overlay instance controlled by this view</td>
	</tr>
	<tr>
		<td>overlayOptions</td>
		<td>{}</td>
		<td>Properties set on this.gOverlay upon creation of the google maps overlay instance</td>
	</tr>
</table>

#### Methods
<table>
	<tr>
		<td>Method</td>
		<td>Parameters</td>
		<td>Return Value</td>
		<td>Description</td>
	</tr>
	<tr>
		<td>bindMapEvents</td>
		<td>mapEvents (optional)</td>
		<td></td>
		<td>Attaches listeners for the events in the mapEvents hash to this.gOverlay</td>
	</tr>
</table>


### GoogleMaps.InfoWindow

View controller for a google.maps.InfoWindow overlay instance. Extends `GoogleMaps.MapView`.

#### Properties

<table>
	<tr>
		<td>Property</td>
		<td>Default Value</td>
		<td>Description</td>
	</tr>
	<tr>
		<td>gOverlay</td>
		<td>Instance of google.maps.InfoWindow</td>
		<td>The instance of the Google maps InfoWindow controlled by this view</td>
	</tr>
	<tr>
		<td>marker (REQUIRED)</td>
		<td></td>
		<td>The marker associated with this.gOverlay</td>
	</tr>
	<tr>
		<td>template</td>
		<td>"&lt;h2&gt;&lt;%=title %&gt;&lt;/h2&gt;"</td>
		<td>A selector string for a template element</td>
	</tr>
</table>


#### Methods
<table>
	<tr>
		<td>Method</td>
		<td>Parameters</td>
		<td>Return Value</td>
		<td>Description</td>
	</tr>
	<tr>
		<td>render</td>
		<td></td>
		<td>this</td>
		<td>Instantiates a google.maps.InfoWindow object, and displays it on this.map</td>
	</tr>
</table>



### GoogleMaps.MarkerView

View controller for a marker overlay. Extends `GoogleMaps.MapView`.

#### Properties

<table>
	<tr>
		<td>Property</td>
		<td>Default Value</td>
		<td>Description</td>
	</tr>
	<tr>
		<td>gOverlay</td>
		<td>Instance of google.maps.Marker</td>
		<td>The instance of the Google maps Marker overlay controlled by this view</td>
	</tr>
	<tr>
		<td>infoWindow</td>
		<td>GoogleMaps.InfoWindow</td>
		<td>The InfoWindow view class used to when opening an infoWindow for this marker</td>
	</tr>
</table>

#### Methods
<table>
	<tr>
		<td>Method</td>
		<td>Parameters</td>
		<td>Return Value</td>
		<td>Description</td>
	</tr>
	<tr>
		<td>refreshOverlay</td>
		<td></td>
		<td></td>
		<td>Updates the position of the marker view on the map</td>
	</tr>

	<tr>
		<td>toggleSelect</td>
		<td></td>
		<td></td>
		<td>A pass-through to this.model.toggleSelect()</td>
	</tr>
	<tr>
		<td>render</td>
		<td></td>
		<td>this</td>
		<td>Sets as visisible this.gOverlay (the marker instance itself is created in the constructor)</td>
	</tr>
	<tr>
		<td>openDetail</td>
		<td></td>
		<td></td>
		<td>opens the InfoWindow associated with this marker</td>
	</tr>
	<tr>
		<td>closeDetail</td>
		<td></td>
		<td></td>
		<td>closes the InfoWindow associated with this marker</td>
	</tr>
</table>



### GoogleMaps.MarkerCollectionView

View controller for a collection of `GoogleMaps.MarkerView` instances. Extends Backbone.View.

#### Properties

<table>
	<tr>
		<td>Property</td>
		<td>Default Value</td>
		<td>Description</td>
	</tr>
	<tr>
		<td>markerView</td>
		<td>GoogleMaps.MarkerView</td>
		<td>The MarkerView view class used to when creating child MarkerView instances</td>
	</tr>
	<tr>
		<td>map</td>
		<td></td>
		<td>The google.maps.Map instance to which the overlay is attached</td>
	</tr>
</table>


#### Methods
<table>
	<tr>
		<td>Method</td>
		<td>Parameters</td>
		<td>Return Value</td>
		<td>Description</td>
	</tr>
	<tr>
		<td>render</td>
		<td>collection (optional - defaults to this.collection)</td>
		<td></td>
		<td>Renders and displays MarkerViews for each model in this.collection</td>
	</tr>
	<tr>
		<td>closeChildren</td>
		<td></td>
		<td></td>
		<td>Removes all child MarkerView views</td>
	</tr>
	<tr>
		<td>closeChild</td>
		<td>child (Location model, or MarkerView instance)</td>
		<td></td>
		<td>Closes a single child MarkerView instance</td>
	</tr>
	<tr>
		<td>addChild</td>
		<td>child (Location model)</td>
		<td></td>
		<td>Renders and displays a single MarkerView</td>
	</tr>
	<tr>
		<td>refresh</td>
		<td></td>
		<td></td>
		<td>Closes all child MarkerView instances, and opens new instances</td>
	</tr>
</table>

