
var selectedShape;
var map;
function initialize() {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 10,
        center: {
            lat: 41.879,
            lng: -87.624
        }, // Center the map on Chicago, USA.
        mapTypeId: 'satellite' //hybrid //terrain//satellite
    });
    // User CurrentPosition to center map
    //   if (navigator.geolocation) {
    //      navigator.geolocation.getCurrentPosition(function (position) {
    //          initialLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    //          map.setCenter(initialLocation);
    //      });
    //  }

    // Creates a drawing manager attached to the map that allows the user to draw polygon
    var drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: google.maps.drawing.OverlayType.POLYGON,
        drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_CENTER,
            drawingModes: [
                google.maps.drawing.OverlayType.POLYGON,
            ]
        },
        
    });
    drawingManager.setMap(map);
    //////////////////////////////////////////
    

    function clearSelection() {
        if (selectedShape) {
            if (selectedShape.type !== 'marker') {
                selectedShape.setEditable(false);
            }

            selectedShape = null;
        }
    }

    function setSelection(shape) {
        if (shape.type !== 'marker') {
            clearSelection();
            shape.setEditable(true);
        }
        selectedShape = shape;
    }
    //////////////////////////////////////////
    // Event when a new poligon is drawn
    
    google.maps.event.addListener(drawingManager, 'overlaycomplete', function(e) {
        var newShape = e.overlay;
        newShape.type = e.type;
        setSelection(newShape);
        // Switch back to non-drawing mode after drawing a shape.
        drawingManager.setDrawingMode(null);
        // Remove drawingControl after drawing a shape
        drawingManager.setOptions({drawingControl: false});
        
        var infoWindow = null;
        newShape.addListener("click", showInfoWindow);
        function showInfoWindow(event) {
            setSelection(newShape);
            if (infoWindow) {
                infoWindow.close();
            }
            infoWindow = new google.maps.InfoWindow();
            let contentString =
                "<b>Selected polygon</b><br>" +
                "<button type=\"button\" onclick=\"generatePath()\">Generate Path</button>"
            
            // set the info window's content and position.
            infoWindow.setContent(contentString);
            infoWindow.setPosition(event.latLng);
            infoWindow.open(map);
        }


    });

    google.maps.event.addDomListener(window, "load", initialize);
}

