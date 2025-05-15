# Location Picker

A lightweight, standalone location picker with a Leaflet-based interactive map that can be embedded in any webpage via an iframe. The component allows users to select a location and specify a radius, with options for automatically sending data and customizing the UI for small spaces.

![Location Picker Screenshot](https://your-screenshot-url-here.png)

## Features

- **Interactive Map**: Click anywhere to select a location or drag the marker to fine-tune position
- **Adjustable Radius**: Set a radius around the selected point with visual feedback
- **Geolocation Support**: "Find My Location" button to use the device's geolocation
- **Two-way Communication**: Communicate with the parent page via the postMessage API
- **Responsive Design**: Automatically adapts to small containers
- **Auto-send Mode**: Automatically update parent page without clicking "Apply"
- **Collapsible Control Panel**: Maximize map space by hiding controls
- **Fully Customizable**: Configure from parent window with simple API

## Installation

### Option 1: Host the HTML file yourself

1. Download the `location-picker.html` file
2. Host it on your server
3. Embed it in an iframe on your page

### Option 2: Copy into your project

1. Copy the HTML content into a new file in your project
2. Name it `location-picker.html` or similar
3. Serve it from your web server

## Basic Usage

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Location Picker Demo</title>
    <style>
        .map-container {
            width: 600px;
            height: 400px;
            border: 1px solid #ccc;
        }
    </style>
</head>
<body>
    <h1>Location Picker Demo</h1>
    
    <!-- Embed the Location Picker in an iframe -->
    <iframe 
        id="location-picker-iframe"
        src="path-to/location-picker.html" 
        width="100%" 
        height="100%" 
        style="border: none;"
        class="map-container">
    </iframe>
    
    <!-- Display selected location -->
    <div id="selected-location">
        <p>Selected Location: <span id="lat">0.00000</span>, <span id="lng">0.00000</span></p>
        <p>Radius: <span id="radius">500</span> meters</p>
    </div>

    <script>
        // Listen for messages from the iframe
        window.addEventListener('message', function(event) {
            // Handle location updates
            if (event.data.type === 'LOCATION_PICKER_UPDATE') {
                const { lat, lng, radius } = event.data.data;
                
                // Update display
                document.getElementById('lat').textContent = lat.toFixed(5);
                document.getElementById('lng').textContent = lng.toFixed(5);
                document.getElementById('radius').textContent = radius;
                
                // Do something with the location data
                console.log('Location updated:', event.data.data);
            }
            
            // Handle ready event
            else if (event.data.type === 'LOCATION_PICKER_READY') {
                console.log('Location picker ready!');
                
                // Optionally set initial location
                setLocation(51.505, -0.09, 500);
            }
        });
        
        // Function to set location from parent page
        function setLocation(lat, lng, radius) {
            const iframe = document.getElementById('location-picker-iframe');
            iframe.contentWindow.postMessage({
                type: 'SET_LOCATION_PICKER',
                data: { lat, lng, radius }
            }, '*');
        }
    </script>
</body>
</html>
```

## Advanced Usage

### Parent-to-Child Communication API

You can control the Location Picker from the parent page with these message types:

#### 1. Set Location

```javascript
iframe.contentWindow.postMessage({
    type: 'SET_LOCATION_PICKER',
    data: {
        lat: 40.7128,    // Latitude
        lng: -74.0060,   // Longitude
        radius: 1000     // Radius in meters (optional)
    }
}, '*');
```

#### 2. Configure Options

```javascript
iframe.contentWindow.postMessage({
    type: 'CONFIGURE_LOCATION_PICKER',
    data: {
        autoSend: true,              // Enable auto-sending (optional)
        controlPanelVisible: false   // Hide/show control panel (optional)
    }
}, '*');
```

#### 3. Request Current Location Data

```javascript
iframe.contentWindow.postMessage({
    type: 'REQUEST_LOCATION_DATA'
}, '*');
```

### Child-to-Parent Communication API

The Location Picker sends these message types to the parent page:

#### 1. Location Update

```javascript
{
    type: 'LOCATION_PICKER_UPDATE',
    data: {
        lat: 51.505,    // Latitude
        lng: -0.09,     // Longitude
        radius: 500     // Radius in meters
    }
}
```

#### 2. Ready Notification

```javascript
{
    type: 'LOCATION_PICKER_READY',
    data: {
        capabilities: ['autoSend', 'hidePanel', 'setLocation', 'getLocation']
    }
}
```

## React Integration Example

```jsx
import React, { useEffect, useState, useRef } from 'react';

function LocationPickerContainer() {
  const [location, setLocation] = useState({
    lat: 51.505,
    lng: -0.09,
    radius: 500
  });
  const [controlPanelVisible, setControlPanelVisible] = useState(true);
  const [autoSend, setAutoSend] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    // Listen for messages from the iframe
    const handleMessage = (event) => {
      if (event.data.type === 'LOCATION_PICKER_UPDATE') {
        setLocation(event.data.data);
        console.log('Location updated:', event.data.data);
      } else if (event.data.type === 'LOCATION_PICKER_READY') {
        console.log('Location picker is ready with capabilities:', event.data.data.capabilities);
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Function to set location in the iframe
  const setLocationInPicker = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'SET_LOCATION_PICKER',
        data: {
          lat: 40.7128,
          lng: -74.0060,
          radius: 1000
        }
      }, '*');
    }
  };

  // Toggle control panel visibility
  const toggleControlPanel = () => {
    const newValue = !controlPanelVisible;
    setControlPanelVisible(newValue);
    
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'CONFIGURE_LOCATION_PICKER',
        data: {
          controlPanelVisible: newValue
        }
      }, '*');
    }
  };

  // Toggle auto-send feature
  const toggleAutoSend = () => {
    const newValue = !autoSend;
    setAutoSend(newValue);
    
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'CONFIGURE_LOCATION_PICKER',
        data: {
          autoSend: newValue
        }
      }, '*');
    }
  };

  return (
    <div>
      <h2>Location Picker Demo</h2>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        <button onClick={toggleControlPanel}>
          {controlPanelVisible ? 'Hide Control Panel' : 'Show Control Panel'}
        </button>
        <button onClick={toggleAutoSend}>
          {autoSend ? 'Disable Auto-Send' : 'Enable Auto-Send'}
        </button>
        <button onClick={setLocationInPicker}>
          Set to New York
        </button>
      </div>
      
      <iframe
        ref={iframeRef}
        src="path-to-your-html-file.html"
        width="100%"
        height="500px"
        style={{ border: '1px solid #ccc' }}
        title="Location Picker"
      />
      
      <div>
        <p>Selected Location: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}</p>
        <p>Radius: {location.radius} meters</p>
      </div>
    </div>
  );
}

export default LocationPickerContainer;
```

## Examples for Specific Use Cases

### Minimal UI for Small Containers

```html
<div style="width: 300px; height: 250px; border: 1px solid #ccc;">
  <iframe 
    id="mini-picker"
    src="location-picker.html" 
    width="100%" 
    height="100%" 
    style="border: none;">
  </iframe>
</div>

<script>
  window.addEventListener('message', function(event) {
    if (event.data.type === 'LOCATION_PICKER_READY') {
      // Configure for small container
      document.getElementById('mini-picker').contentWindow.postMessage({
        type: 'CONFIGURE_LOCATION_PICKER',
        data: {
          controlPanelVisible: false,
          autoSend: true
        }
      }, '*');
    }
  });
</script>
```

### Using it in a Form

```javascript
document.getElementById('my-form').addEventListener('submit', function(event) {
  event.preventDefault();
  
  // Get location data
  document.getElementById('location-picker').contentWindow.postMessage({
    type: 'REQUEST_LOCATION_DATA'
  }, '*');
  
  // Handle the response in the message listener and submit the form there
});

window.addEventListener('message', function(event) {
  if (event.data.type === 'LOCATION_PICKER_UPDATE') {
    document.getElementById('lat-input').value = event.data.data.lat;
    document.getElementById('lng-input').value = event.data.data.lng;
    document.getElementById('radius-input').value = event.data.data.radius;
    
    // Now you can submit the form if this was triggered by form submission
  }
});
```

## Dependencies

- [Leaflet](https://leafletjs.com/) - An open-source JavaScript library for mobile-friendly interactive maps
- [OpenStreetMap](https://www.openstreetmap.org/) - Free map tiles used by the Leaflet map

## Browser Compatibility

This component is compatible with all modern browsers that support:
- iframe communication with postMessage
- HTML5 Geolocation API
- ES6 JavaScript features
- Leaflet map library

## License

This location picker is free to use and modify for any purpose.

## Contributing

Feel free to submit issues or pull requests if you have suggestions for improvements.

## Credits

Developed with ❤️ using Leaflet and OpenStreetMap.
