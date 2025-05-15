# Location Picker Pro

**A lightweight, standalone, and highly customizable location picker with an interactive Leaflet map. Embeddable via iframe for easy integration into any web project.**

Users can click to select a location, drag a marker, use their device's geolocation, and define an adjustable radius with visual feedback. Communication with the parent page is handled seamlessly via the `postMessage` API.

[Location Picker (PREVIEW)](https://samkarya.github.io/PlugIn/LocationPicker/) 


## ✨ Features

-   **Interactive Leaflet Map**: Smoothly pan, zoom, click to select, or drag the marker.
-   **Adjustable Radius**: Visually set and see a radius around the selected point.
-   **Device Geolocation**: "Find My Location" button to jump to the user's current position.
-   **Two-Way `postMessage` API**: Robust communication between your parent page and the picker.
-   **Responsive Design**: Adapts to various container sizes, with UI collapsing for smaller spaces.
-   **Real-time Updates (Auto-Send)**: Configure to send location data to the parent page automatically on any change.
-   **Collapsible Control Panel**: Option to hide controls (latitude, longitude, radius inputs) to maximize map space, ideal for display-only or small UIs.
-   **Highly Configurable**: Set initial location, radius, UI visibility, and behavior from the parent window.
-   **Standalone HTML**: Single HTML file, no complex build steps required for the picker itself.
-   **Lightweight**: Minimal dependencies (Leaflet and its default OpenStreetMap tiles).

## 🚀 Quick Start

1.  **Host `location-picker.html`**:
    *   Download the `location-picker.html` file from this repository.
    *   Place it on your web server or within your project's public/static assets folder.
2.  **Embed in an Iframe**:
    ```html
    <iframe 
        id="location-picker-iframe"
        src="https://samkarya.github.io/PlugIn/LocationPicker/"  <!-- Or path-to-your-hosted/location-picker.html -->
        width="600px" 
        height="450px" 
        style="border: 1px solid #ccc; border-radius: 8px;"
        title="Location Picker Map">
    </iframe>
    ```
3.  **Listen for Updates**:
    ```html
    <div id="selected-location-display">
        Lat: <span id="lat">N/A</span>, 
        Lng: <span id="lng">N/A</span>, 
        Radius: <span id="radius">N/A</span>m
    </div>

    <script>
        const iframeElement = document.getElementById('location-picker-iframe');
        const expectedOrigin = "https://samkarya.github.io"; // Or your self-hosted origin

        window.addEventListener('message', (event) => {
            // IMPORTANT: Always validate the origin of the message for security
            if (event.origin !== expectedOrigin) {
                console.warn("Message from untrusted origin:", event.origin);
                return;
            }

            const { data: messageData } = event;

            if (messageData.type === 'LOCATION_PICKER_READY') {
                console.log('Location Picker is ready!', messageData.data.capabilities);
                
                // Example: Configure auto-send and set initial location once ready
                iframeElement.contentWindow.postMessage({
                    type: 'CONFIGURE_LOCATION_PICKER',
                    data: { autoSend: true, controlPanelVisible: true }
                }, expectedOrigin);
                
                iframeElement.contentWindow.postMessage({
                    type: 'SET_LOCATION_PICKER',
                    data: { lat: 34.0522, lng: -118.2437, radius: 1500 } // Example: Los Angeles
                }, expectedOrigin);
            } else if (messageData.type === 'LOCATION_PICKER_UPDATE') {
                const { lat, lng, radius } = messageData.data;
                document.getElementById('lat').textContent = lat.toFixed(5);
                document.getElementById('lng').textContent = lng.toFixed(5);
                document.getElementById('radius').textContent = radius;
                console.log('Location updated by picker:', messageData.data);
            }
        });
    </script>
    ```

## 🛠️ API Reference

Communication is handled via `window.postMessage()`. Remember to specify the `targetOrigin` when sending messages to the iframe for security.

### Parent Page ➡️ Location Picker (Sending Messages)

Target the iframe's `contentWindow` to send messages.

**1. Set Location & Radius**
   Updates the map's marker position and the radius circle.
   ```javascript
   const iframe = document.getElementById('location-picker-iframe');
   iframe.contentWindow.postMessage({
       type: 'SET_LOCATION_PICKER',
       data: {
           lat: 40.7128,    // Latitude (Number)
           lng: -74.0060,   // Longitude (Number)
           radius: 1000     // Radius in meters (Number, optional, defaults to previous or initial)
       }
   }, 'https://samkarya.github.io' /* Replace with picker's origin */);
   ```

**2. Configure Options**
   Adjust the picker's behavior and UI.
   ```javascript
   iframe.contentWindow.postMessage({
       type: 'CONFIGURE_LOCATION_PICKER',
       data: {
           autoSend: true,              // Boolean (optional): If true, sends `LOCATION_PICKER_UPDATE` on every map change.
           controlPanelVisible: false,  // Boolean (optional): Show/hide the lat/lng/radius input panel.
           // future options can be added here
       }
   }, 'https://samkarya.github.io');
   ```

**3. Request Current Location Data**
   Asks the picker to send its current `lat`, `lng`, and `radius` via a `LOCATION_PICKER_UPDATE` message.
   ```javascript
   iframe.contentWindow.postMessage({
       type: 'REQUEST_LOCATION_DATA'
   }, 'https://samkarya.github.io');
   ```

### Location Picker ➡️ Parent Page (Receiving Messages)

Listen for messages on the `window` object in your parent page.

**1. Location Update**
   Sent when the location or radius changes in the picker (especially if `autoSend` is true, or after "Apply" is clicked if `autoSend` is false and control panel is visible, or in response to `REQUEST_LOCATION_DATA`).
   ```javascript
   // event.data will be:
   {
       type: 'LOCATION_PICKER_UPDATE',
       data: {
           lat: 51.505,    // Latitude (Number)
           lng: -0.09,     // Longitude (Number)
           radius: 500     // Radius in meters (Number)
       }
   }
   ```

**2. Ready Notification**
   Sent once the picker's internal scripts and map have initialized and it's ready to receive commands.
   ```javascript
   // event.data will be:
   {
       type: 'LOCATION_PICKER_READY',
       data: {
           capabilities: ['autoSend', 'hidePanel', 'setLocation', 'getLocation'] // Lists available features
       }
   }
   ```
   It's best practice to wait for `LOCATION_PICKER_READY` before sending initial `SET_LOCATION_PICKER` or `CONFIGURE_LOCATION_PICKER` messages.

## 💡 React Integration Example

Here's how you might use the Location Picker in a React component:

```jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';

const LOCATION_PICKER_IFRAME_URL = "https://samkarya.github.io/PlugIn/LocationPicker/"; // Or your self-hosted URL
const PICKER_ORIGIN = new URL(LOCATION_PICKER_IFRAME_URL).origin;

function MyFormComponent() {
  const [selectedLocation, setSelectedLocation] = useState({
    lat: 37.7749, // Default: San Francisco
    lng: -122.4194,
    radius: 1000
  });
  const [isPickerReady, setIsPickerReady] = useState(false);
  const iframeRef = useRef(null);

  // Memoized message sending function
  const postMessageToPicker = useCallback((message) => {
    if (iframeRef.current && iframeRef.current.contentWindow && isPickerReady) {
      iframeRef.current.contentWindow.postMessage(message, PICKER_ORIGIN);
    } else if (iframeRef.current && iframeRef.current.contentWindow && message.type === 'CONFIGURE_LOCATION_PICKER') {
      // Allow config messages even if our 'isPickerReady' state isn't true yet,
      // as the picker might become ready and apply them.
      iframeRef.current.contentWindow.postMessage(message, PICKER_ORIGIN);
    }
  }, [isPickerReady]); // isPickerReady ensures we don't send too early for SET_LOCATION

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== PICKER_ORIGIN) return;

      const { data: msgData } = event;
      if (msgData.type === 'LOCATION_PICKER_UPDATE') {
        setSelectedLocation(msgData.data);
        console.log('React: Location updated from picker -', msgData.data);
      } else if (msgData.type === 'LOCATION_PICKER_READY') {
        console.log('React: Location picker is ready -', msgData.data.capabilities);
        setIsPickerReady(true);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []); // Empty dependency array for global listener setup

  // Effect to send initial/updated location and config to picker when ready or values change
  useEffect(() => {
    if (isPickerReady) {
      postMessageToPicker({
        type: 'CONFIGURE_LOCATION_PICKER',
        data: { autoSend: true, controlPanelVisible: false } // Example: auto-send, hide panel
      });
      postMessageToPicker({
        type: 'SET_LOCATION_PICKER',
        data: selectedLocation
      });
    }
  }, [isPickerReady, selectedLocation, postMessageToPicker]);

  // Example: Handler for manual input changes that updates the map
  const handleRadiusChange = (e) => {
    const newRadius = parseInt(e.target.value, 10);
    if (!isNaN(newRadius)) {
      const newLocation = { ...selectedLocation, radius: newRadius };
      setSelectedLocation(newLocation);
      // The useEffect above will send it to the picker if it's ready
    }
  };

  return (
    <div>
      <h2>Host Location Setup</h2>
      <div style={{ marginBottom: '1rem' }}>
        Lat: <input type="number" value={selectedLocation.lat} onChange={e => setSelectedLocation(l => ({...l, lat: parseFloat(e.target.value)}))} step="any" />
        Lng: <input type="number" value={selectedLocation.lng} onChange={e => setSelectedLocation(l => ({...l, lng: parseFloat(e.target.value)}))} step="any" />
        Radius (m): <input type="number" value={selectedLocation.radius} onChange={handleRadiusChange} />
      </div>

      <div style={{ width: '100%', height: '400px', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
        <iframe
          ref={iframeRef}
          src={LOCATION_PICKER_IFRAME_URL}
          width="100%"
          height="100%"
          style={{ border: 'none' }}
          title="Interactive Location Picker"
          sandbox="allow-scripts allow-geolocation" // allow-geolocation for "Find My Location" button inside iframe
        />
      </div>
      
      <div style={{ marginTop: '1rem' }}>
        <p><strong>Selected:</strong> Lat: {selectedLocation.lat.toFixed(5)}, Lng: {selectedLocation.lng.toFixed(5)}, Radius: {selectedLocation.radius}m</p>
      </div>
    </div>
  );
}

export default MyFormComponent;
```

## 🖼️ Styling & Customization

-   The Location Picker uses standard HTML elements that can be styled via its internal CSS.
-   For advanced customization of the Leaflet map appearance (tile layers, marker icons, circle styles), you would need to modify the `location-picker.html` source directly.
-   The `controlPanelVisible` configuration option allows for a minimal map-only UI.

## ⚙️ Dependencies

-   **Leaflet.js (~1.9.x)**: For the interactive map.
-   **OpenStreetMap Tiles**: Default map tile provider.
-   No external JavaScript frameworks are used within `location-picker.html` itself, keeping it lightweight.

## 🌐 Browser Compatibility

Designed to work in all modern web browsers that support:
-   `<iframe>` element
-   `window.postMessage` API
-   HTML5 Geolocation API (for "Find My Location" feature)
-   ES6+ JavaScript features (used internally)

## 🙌 Contributing

Contributions, issues, and feature requests are welcome! Please feel free to open an issue or submit a pull request on the [GitHub repository](https://github.com/Samkarya/PlugIn). <!-- TODO: Update with actual repo URL -->

## 🙏 Credits

-   Developed by Samkarya.
-   Utilizes the fantastic [Leaflet](https://leafletjs.com/) library.
-   Map data by [OpenStreetMap](https://www.openstreetmap.org/) contributors.
