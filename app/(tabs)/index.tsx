import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ImageBackground,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  TouchableOpacity,
  Linking,
  Platform,
  RefreshControl,
  Modal,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { consumeFlash } from "../../services/flash";
import * as Location from "expo-location";
import LocationPopupProvider from "../../components/LocationPopupProvider";
import { Ionicons } from "@expo/vector-icons";
import { getCustomers, updateCustomerStatus } from "../../services/api";
import WebView from "react-native-webview";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

type Customer = {
  _id: string;
  name: string;
  address: string;
  phone?: string;
  latitude: number | null;
  longitude: number | null;
  orderDetails?: string;
  deliveryPerson?: string;
  status: string;
  deliveryDate: string;
  createdAt: string;
  updatedAt: string;
};

export default function HomeScreen() {
  const router = useRouter();
  const [successVisible, setSuccessVisible] = useState(false);
  const [successText, setSuccessText] = useState("");

  // State for backend data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for in-app maps
  const [mapsVisible, setMapsVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [webViewLoading, setWebViewLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const [allMapsVisible, setAllMapsVisible] = useState(false);
  const [allWebViewLoading, setAllWebViewLoading] = useState(true);
  const [allMapError, setAllMapError] = useState(false);

  useEffect(() => {
    const msg = consumeFlash();
    if (msg) {
      setSuccessText(msg);
      setSuccessVisible(true);
    }
    loadCustomers();
  }, []);

  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);

  // Load customers from backend
  const loadCustomers = async () => {
    try {
      setError(null);
      console.log("Loading customers from backend...");

      const response = await getCustomers();
      console.log("Backend response:", response);

      if (response.success && Array.isArray(response.customers)) {
        setCustomers(response.customers);
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (error: any) {
      console.error("Error loading customers:", error);
      setError(error.message || "Failed to load customers");
      Alert.alert("Error", "Failed to load customers from server");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCustomers();
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance);
  };

  const startLocationTracking = async () => {
    try {
      setLocationLoading(true);

      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required for this app to work properly."
        );
        setLocationPermission(false);
        setLocationLoading(false);
        return;
      }

      setLocationPermission(true);

      // Get initial position
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      setCurrentLocation({ latitude, longitude });
      try {
        // Reverse geocode to get a human readable address
        const geocoded = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        if (geocoded && geocoded.length > 0) {
          const a = geocoded[0];
          const parts = [
            a.name,
            a.street,
            a.city,
            a.region,
            a.postalCode,
            a.country,
          ].filter(Boolean);
          setCurrentAddress(parts.join(", "));
        } else {
          setCurrentAddress(null);
        }
      } catch (err) {
        console.warn("Reverse geocode failed", err);
        setCurrentAddress(null);
      }
      setLocationLoading(false);
    } catch (error) {
      console.error("Location error:", error);
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    startLocationTracking();
  }, []);

  const formatCoordinates = (
    location: { latitude: number; longitude: number } | null
  ) => {
    if (!location) return "Unknown";
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  };

  const openDirectionsInApp = async (customer: Customer) => {
    if (!currentLocation) {
      Alert.alert(
        "Location required",
        "Current location is required to open directions. Please enable location and try again."
      );
      return;
    }

    // Validate coordinates
    if (!customer.latitude || !customer.longitude) {
      Alert.alert(
        "Invalid Location",
        "This customer doesn't have valid location coordinates."
      );
      return;
    }

    setSelectedCustomer(customer);
    setMapsVisible(true);
    setMapError(false);
    setWebViewLoading(true);
  };

  // Professional Google Maps HTML with better error handling

  const generateMapsHTML = () => {
    if (!selectedCustomer || !currentLocation) return "";

    const API_KEY = "AIzaSyDkHCSewOJ2keasHIqv8TxjPkaNDULEA0M";

    const origin = `${currentLocation.latitude},${currentLocation.longitude}`;
    const destination = `${selectedCustomer.latitude},${selectedCustomer.longitude}`;

    const embedUrl = `https://www.google.com/maps/embed/v1/directions?key=${API_KEY}&origin=${origin}&destination=${destination}&mode=driving`;

    // Calculate distance for display
    const calculateDistance = (
      lat1: number,
      lon1: number,
      lat2: number,
      lon2: number
    ): number => {
      const R = 6371000;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return Math.round(R * c);
    };

    const distance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      selectedCustomer.latitude!,
      selectedCustomer.longitude!
    );

    const distanceText =
      distance < 1000
        ? `${distance}m away`
        : `${(distance / 1000).toFixed(1)}km away`;

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body, html {
          height: 100%;
          width: 100%;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #f8f9fa;
          overflow: hidden;
        }
        
        .container {
          height: 100vh;
          width: 100vw;
          display: flex;
          flex-direction: column;
        }
        
        /* Customer Info Header */
        .customer-header {
          background: linear-gradient(135deg, #667eea 0%, #381bdeff 100%);
          color: white;
          padding: 20px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          z-index: 100;
        }
        
        .customer-name {
          font-size: 20px;
          font-weight: 700;
          margin-top: 18px;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .customer-name i {
          font-size: 18px;
        }
        
        .customer-address {
          font-size: 14px;
          opacity: 0.9;
          margin-bottom: 12px;
          line-height: 1.4;
        }
        
        .delivery-info {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }
        
        .info-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          background: rgba(255,255,255,0.2);
          padding: 6px 12px;
          border-radius: 20px;
          backdrop-filter: blur(10px);
        }
        
        .info-item i {
          font-size: 12px;
        }
        
        .distance {
          color: #4ade80;
          font-weight: 600;
        }
        
        .status {
          color: #fbbf24;
          font-weight: 600;
        }
        
        /* Map Container */
        .map-container {
          flex: 1;
          position: relative;
          background: #e5e7eb;
        }
        
        iframe {
          width: 100%;
          height: 100%;
          border: none;
        }
        
        /* Loading State */
        .loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(248, 249, 250, 0.95);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          z-index: 50;
        }
        
        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #e5e7eb;
          border-top: 4px solid #007AFF;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        
        .loading-text {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }
        
        .loading-subtext {
          font-size: 14px;
          color: #6b7280;
          text-align: center;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Quick Actions */
        .quick-actions {
          position: absolute;
          bottom: 20px;
          right: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          z-index: 40;
        }
        
        .action-btn {
          width: 48px;
          height: 48px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          font-size: 20px;
          color: #374151;
        }
        
        .action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.2);
        }
        
        .action-btn.primary {
          background: #007AFF;
          color: white;
        }
        
        /* Error State */
        .error-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: white;
          display: none;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 40px;
          text-align: center;
          z-index: 60;
        }
        
        .error-icon {
          font-size: 64px;
          margin-bottom: 16px;
          color: #ef4444;
        }
        
        .error-title {
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 8px;
        }
        
        .error-message {
          font-size: 16px;
          color: #6b7280;
          margin-bottom: 24px;
          line-height: 1.5;
        }
        
        .retry-btn {
          background: #007AFF;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .retry-btn:hover {
          background: #0056b3;
        }
        
        /* Responsive */
        @media (max-width: 480px) {
          .customer-header {
            padding: 16px;
          }
          
          .customer-name {
            font-size: 18px;
          }
          
          .delivery-info {
            gap: 8px;
          }
          
          .info-item {
            font-size: 12px;
            padding: 4px 10px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Customer Information Header -->
        <div class="customer-header">
          <div class="customer-name">
            📍 ${selectedCustomer.name}
          </div>
          <div class="customer-address">
            ${selectedCustomer.address}
          </div>
          <div class="delivery-info">
            <div class="info-item distance">
              🚗 ${distanceText}
            </div>
            <div class="info-item status">
              ⏱️ ${selectedCustomer.status || "In Progress"}
            </div>
            ${
              selectedCustomer.orderDetails
                ? `
            <div class="info-item">
              📦 ${selectedCustomer.orderDetails}
            </div>
            `
                : ""
            }
            ${
              selectedCustomer.deliveryPerson
                ? `
            <div class="info-item">
              👤 ${selectedCustomer.deliveryPerson}
            </div>
            `
                : ""
            }
          </div>
        </div>
        
        <!-- Map Container -->
        <div class="map-container">
          <iframe
            src="${embedUrl}"
            id="mapFrame"
            allowfullscreen
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
          ></iframe>
          
          <!-- Loading Overlay -->
          <div class="loading-overlay" id="loadingOverlay">
            <div class="loading-spinner"></div>
            <div class="loading-text">Loading Directions</div>
            <div class="loading-subtext">Preparing your route to ${
              selectedCustomer.name
            }</div>
          </div>
          
          <!-- Error Overlay -->
          <div class="error-overlay" id="errorOverlay">
            <div class="error-icon">🗺️</div>
            <div class="error-title">Unable to Load Map</div>
            <div class="error-message">
              We're having trouble loading the directions. This might be due to network connectivity or temporary service issues.
            </div>
            <button class="retry-btn" onclick="retryLoading()">Try Again</button>
          </div>
          
          <!-- Quick Actions -->
          <div class="quick-actions">
            <button class="action-btn" onclick="zoomIn()" title="Zoom In">+</button>
            <button class="action-btn" onclick="zoomOut()" title="Zoom Out">−</button>
            <button class="action-btn primary" onclick="recenterMap()" title="Recenter">⌖</button>
          </div>
        </div>
      </div>

      <script>
        const mapFrame = document.getElementById('mapFrame');
        const loadingOverlay = document.getElementById('loadingOverlay');
        const errorOverlay = document.getElementById('errorOverlay');
        
        // Hide loading when map loads
        mapFrame.onload = function() {
          console.log('Map loaded successfully');
          loadingOverlay.style.display = 'none';
          errorOverlay.style.display = 'none';
        };
        
        // Show error if map fails to load
        mapFrame.onerror = function() {
          console.error('Failed to load map');
          loadingOverlay.style.display = 'none';
          errorOverlay.style.display = 'flex';
        };
        
        // Auto-hide loading after 10 seconds (fallback)
        setTimeout(() => {
          loadingOverlay.style.display = 'none';
        }, 10000);
        
        // Quick action functions
        function zoomIn() {
          // Note: Direct zoom control not available in embed API
          // This would require full JavaScript API
          alert('Use pinch to zoom on the map');
        }
        
        function zoomOut() {
          alert('Use pinch to zoom on the map');
        }
        
        function recenterMap() {
          // Reload the map to recenter
          mapFrame.src = mapFrame.src;
        }
        
        function retryLoading() {
          errorOverlay.style.display = 'none';
          loadingOverlay.style.display = 'flex';
          mapFrame.src = mapFrame.src;
        }
        
        // Handle page visibility changes
        document.addEventListener('visibilitychange', function() {
          if (!document.hidden) {
            // Page became visible, ensure map is loaded
            if (errorOverlay.style.display === 'flex') {
              retryLoading();
            }
          }
        });
        
        // Initial load
        console.log('Starting map load...');
        
      </script>
    </body>
    </html>
  `;
  };

  // Generate a Leaflet/OpenStreetMap HTML that plots all customers and computes
  // a greedy nearest-neighbor route starting from currentLocation (if available).
  const generateAllCustomersMapHTML = () => {
    try {
      const activeCustomers = customers
        .filter(
          (c) =>
            c.latitude &&
            c.longitude &&
            (c.status || "").toLowerCase() !== "delivered"
        )
        .map((c) => ({
          id: c._id,
          name: c.name,
          address: c.address,
          lat: c.latitude,
          lng: c.longitude,
          orderDetails: c.orderDetails || "",
        }));

      const start = currentLocation
        ? { lat: currentLocation.latitude, lng: currentLocation.longitude }
        : null;

      const customersJson = JSON.stringify(activeCustomers);
      const startJson = JSON.stringify(start);

      return `<!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
        html,body,#map{height:100%;width:100%;margin:0;padding:0}
        body{font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif}
        .topbar{position:absolute;left:12px;right:12px;top:12px;z-index:1000;background:rgba(255,255,255,0.95);padding:10px;border-radius:10px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 6px 18px rgba(0,0,0,0.08)}
        .title{font-weight:700}
        .actions{display:flex;gap:8px}
        .btn{background:#007AFF;color:white;padding:6px 10px;border-radius:8px;text-decoration:none}
        .list{position:absolute;left:12px;bottom:12px;right:12px;z-index:1000;background:rgba(255,255,255,0.95);padding:10px;border-radius:10px;max-height:30vh;overflow:auto}
        .stop{padding:6px;border-bottom:1px solid #eee}
      </style>
    </head>
    <body>
      <div id="map"></div>
      <div class="topbar">
        <div class="title">All Stops</div>
        <div class="actions">
          <a class="btn" id="openExternal" href="#">Open in Google Maps</a>
        </div>
      </div>
      <div id="list" class="list"></div>

      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
        const customers = ${customersJson};
        const start = ${startJson};

        function haversine(a,b){
          const R=6371000;
          const toRad=(d)=>d*Math.PI/180;
          const dLat=toRad(b.lat-a.lat); const dLon=toRad(b.lng-a.lng);
          const A=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLon/2)*Math.sin(dLon/2);
          const C=2*Math.atan2(Math.sqrt(A),Math.sqrt(1-A));
          return R*C;
        }

        const map = L.map('map', { zoomControl: true });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        let points = customers.slice();
        let route = [];
        let current = start ? {lat:start.lat,lng:start.lng} : (points.length?{lat:points[0].lat,lng:points[0].lng}:null);

        while(points.length>0 && current){
          let bestIdx = 0; let bestDist = Infinity;
          for(let i=0;i<points.length;i++){
            const d = haversine(current, {lat:points[i].lat, lng:points[i].lng});
            if(d<bestDist){ bestDist=d; bestIdx=i; }
          }
          const pick = points.splice(bestIdx,1)[0];
          route.push(pick);
          current = {lat:pick.lat,lng:pick.lng};
        }

        const markers = [];
        const latlngs = [];

        // Add start marker
        if(start){
          const m = L.marker([start.lat, start.lng],{title:'Start', opacity:0.9}).addTo(map);
          m.bindPopup('<b>Start</b><br/>' + (start.lat.toFixed(6)+', '+start.lng.toFixed(6)));
          latlngs.push([start.lat,start.lng]);
        }

        route.forEach((s, idx)=>{
          const marker = L.marker([s.lat,s.lng]).addTo(map);
          const popup = '<b>' + s.name + '</b><br/>' + (s.address || '') + '<br/><small>Stop ' + (idx+1) + '</small><br/><a href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(s.lat + ',' + s.lng) + '" target="_blank">Open</a>';
          marker.bindPopup(popup);
          markers.push(marker);
          latlngs.push([s.lat,s.lng]);
        });

        if(latlngs.length>0){
          const poly = L.polyline(latlngs, {color:'#007AFF', weight:4, opacity:0.9}).addTo(map);
          map.fitBounds(poly.getBounds().pad(0.2));
        } else {
          map.setView([0,0],2);
        }

        // Populate list of stops
        const listEl = document.getElementById('list');
        if(route.length===0){ listEl.innerHTML = '<div class="stop">No active stops</div>'; }
        route.forEach((s,idx)=>{
          const el = document.createElement('div'); el.className='stop';
          el.innerHTML = '<div style="font-weight:700">' + (idx+1) + '. ' + s.name + '</div><div style="font-size:12px;color:#666">' + (s.address||'') + '</div>';
          el.onclick = ()=>{ markers[idx].openPopup(); map.panTo([s.lat,s.lng]); };
          listEl.appendChild(el);
        });

        // External Google Maps directions link (all stops)
        document.getElementById('openExternal').href = (function(){
          if(route.length===0) return '#';
          const origin = start ? (start.lat+','+start.lng) : (route[0].lat+','+route[0].lng);
          const destination = route[route.length-1].lat+','+route[route.length-1].lng;
          const waypoints = route.length>2 ? route.slice(0,route.length-1).map(r=>r.lat+','+r.lng).join('|') : '';
          let url = 'https://www.google.com/maps/dir/?api=1&origin='+encodeURIComponent(origin)+'&destination='+encodeURIComponent(destination)+'&travelmode=driving';
          if(waypoints) url += '&waypoints='+encodeURIComponent(waypoints);
          return url;
        })();

      </script>
    </body>
    </html>`;
    } catch (err) {
      console.error("Failed to build all customers map HTML", err);
      return "<html><body><h3>Failed to generate map</h3></body></html>";
    }
  };

  // Handle WebView loading states
  const handleWebViewLoadStart = () => {
    setWebViewLoading(true);
    setMapError(false);
  };

  const handleWebViewLoadEnd = () => {
    setWebViewLoading(false);
  };

  const handleWebViewError = () => {
    setWebViewLoading(false);
    setMapError(true);
  };

  // All-stops map handlers
  const openAllCustomersMap = () => {
    setAllMapsVisible(true);
    setAllWebViewLoading(true);
    setAllMapError(false);
  };

  const handleAllWebViewLoadStart = () => {
    setAllWebViewLoading(true);
    setAllMapError(false);
  };

  const handleAllWebViewLoadEnd = () => {
    setAllWebViewLoading(false);
  };

  const handleAllWebViewError = () => {
    setAllWebViewLoading(false);
    setAllMapError(true);
  };

  const openAllInExternalMaps = async () => {
    const active = customers
      .filter(
        (c) =>
          c.latitude &&
          c.longitude &&
          (c.status || "").toLowerCase() !== "delivered"
      )
      .map((c) => `${c.latitude},${c.longitude}`);

    if (active.length === 0) {
      Alert.alert(
        "No stops",
        "There are no active stops to open in external maps."
      );
      return;
    }

    const origin = currentLocation
      ? `${currentLocation.latitude},${currentLocation.longitude}`
      : active[0];
    const destination = active[active.length - 1];
    const waypoints =
      active.length > 2 ? active.slice(0, active.length - 1).join("|") : "";

    let url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      origin
    )}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
    if (waypoints) url += `&waypoints=${encodeURIComponent(waypoints)}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else Alert.alert("Error", "Cannot open external maps.");
    } catch (err) {
      console.error("Open all external maps failed", err);
      Alert.alert("Error", "Failed to open external maps.");
    }
  };

  // Open in external Google Maps app
  const openInExternalApp = async (customer: Customer) => {
    if (!customer.latitude || !customer.longitude) {
      Alert.alert(
        "Invalid Location",
        "This customer doesn't have valid location coordinates."
      );
      return;
    }

    const destination = `${customer.latitude},${customer.longitude}`;
    let url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      destination
    )}&travelmode=driving`;

    if (currentLocation) {
      const origin = `${currentLocation.latitude},${currentLocation.longitude}`;
      url += `&origin=${encodeURIComponent(origin)}`;
    }

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "Error",
          "Google Maps app is not installed on your device."
        );
      }
    } catch (error) {
      console.error("Error opening external app:", error);
      Alert.alert("Error", "Could not open Google Maps. Please try again.");
    }
  };

  const handleSuccessOk = () => {
    setSuccessVisible(false);
  };

  const getNearestCustomerInfo = ():
    | (Customer & { distance: number })
    | null => {
    if (!currentLocation) return null;

    let nearest: (Customer & { distance: number }) | null = null;
    let minDistance = Infinity;

    customers.forEach((customer) => {
      // Skip customers without coordinates or already delivered
      if (!customer.latitude || !customer.longitude) return;
      if (customer.status && customer.status.toLowerCase() === "delivered")
        return;

      const distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        customer.latitude,
        customer.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearest = { ...customer, distance };
      }
    });

    return nearest;
  };

  const nearestCustomer = getNearestCustomerInfo();

  const handleMarkDelivered = async (id: string) => {
    try {
      await updateCustomerStatus(id, "delivered");
      // refresh lists
      await loadCustomers();
      Alert.alert("Success", "Order marked as delivered");
    } catch (err: any) {
      console.error("Failed to update status", err);
      Alert.alert("Error", err?.message || "Failed to update status");
    }
  };

  const [searchQuery, setSearchQuery] = useState("");

  // Prepare filtered and sorted customers by distance (closest first)
  const filteredCustomers = customers.filter((c) => {
    if ((c.status || "").toLowerCase() === "delivered") return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q) ||
      (c.deliveryPerson && c.deliveryPerson.toLowerCase().includes(q)) ||
      (c.orderDetails && c.orderDetails.toLowerCase().includes(q))
    );
  });

  const customersWithDistance = filteredCustomers.map((c) => {
    let distance = null;
    if (currentLocation && c.latitude && c.longitude) {
      distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        c.latitude,
        c.longitude
      );
    }
    return { ...c, distance };
  });

  const sortedCustomers = customersWithDistance.sort((a, b) => {
    if (a.distance == null && b.distance == null) return 0;
    if (a.distance == null) return 1;
    if (b.distance == null) return -1;
    return a.distance - b.distance;
  });

  // Function to generate consistent avatar based on customer ID
  const getCustomerAvatar = (customer: Customer) => {
    const seed = customer._id || customer.name;
    return `https://picsum.photos/seed/${seed}/80/80`;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Professional Header */}
        <ImageBackground
          source={{
            uri: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
          }}
          style={styles.header}
          imageStyle={styles.headerImage}
        >
          <View style={styles.headerOverlay}>
            <View style={styles.titleRow}>
              <View style={styles.logoContainer}>
                <Ionicons name="navigate" size={28} color="#fff" />
              </View>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>Delivery Navigator</Text>
                <Text style={styles.subtitle}>
                  Smart route optimization for efficient deliveries
                </Text>
              </View>
            </View>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{sortedCustomers.length}</Text>
                <Text style={styles.statLabel}>Active Deliveries</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {nearestCustomer ? `${nearestCustomer.distance}m` : "--"}
                </Text>
                <Text style={styles.statLabel}>Nearest Stop</Text>
              </View>
            </View>
          </View>
        </ImageBackground>

        {/* Status Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Location Status</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: locationPermission ? "#10b981" : "#ef4444" },
              ]}
            >
              <Text style={styles.statusBadgeText}>
                {locationPermission ? "ACTIVE" : "DISABLED"}
              </Text>
            </View>
          </View>

          <View style={styles.locationInfo}>
            <Ionicons name="location" size={20} color="#007AFF" />
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationTitle}>Current Position</Text>
              <Text style={styles.locationAddress}>
                {currentAddress || formatCoordinates(currentLocation)}
              </Text>
              {currentLocation && (
                <Text style={styles.locationCoordinates}>
                  {formatCoordinates(currentLocation)}
                </Text>
              )}
            </View>
          </View>

          {locationLoading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Updating location...</Text>
            </View>
          )}
        </View>

        {/* Data Loading Status */}
        {loading && (
          <View style={styles.card}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingTitle}>Loading Deliveries</Text>
              <Text style={styles.loadingSubtitle}>
                Please wait while we fetch your delivery schedule
              </Text>
            </View>
          </View>
        )}

        {error && !loading && (
          <View style={styles.card}>
            <View style={styles.errorContainer}>
              <Ionicons name="warning-outline" size={48} color="#ef4444" />
              <Text style={styles.errorTitle}>Connection Error</Text>
              <Text style={styles.errorMessage}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={loadCustomers}
              >
                <Ionicons name="refresh" size={18} color="#fff" />
                <Text style={styles.retryButtonText}>Retry Connection</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Nearest Customer Card */}
        {!loading && !error && nearestCustomer && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Next Delivery</Text>
              <View
                style={[
                  styles.priorityBadge,
                  {
                    backgroundColor:
                      nearestCustomer.distance <= 100 ? "#10b981" : "#f59e0b",
                  },
                ]}
              >
                <Text style={styles.priorityBadgeText}>
                  {nearestCustomer.distance <= 100 ? "NEARBY" : "PRIORITY"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => openDirectionsInApp(nearestCustomer)}
              style={styles.featuredCustomerCard}
            >
              <View style={styles.customerHeader}>
                <Image
                  source={{ uri: getCustomerAvatar(nearestCustomer) }}
                  style={styles.featuredCustomerThumb}
                />
                <View style={styles.customerInfo}>
                  <Text style={styles.featuredCustomerName}>
                    {nearestCustomer.name}
                  </Text>
                  <Text style={styles.featuredCustomerAddress}>
                    {nearestCustomer.address}
                  </Text>
                  {nearestCustomer.phone ? (
                    <Text style={styles.featuredCustomerPhone}>
                      📞 {nearestCustomer.phone}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.distanceBadge}>
                  <Text style={styles.distanceBadgeText}>
                    {nearestCustomer.distance}m
                  </Text>
                </View>
              </View>

              {nearestCustomer.orderDetails && (
                <View style={styles.orderInfo}>
                  <Ionicons name="cube-outline" size={14} color="#6b7280" />
                  <Text style={styles.orderDetails}>
                    {nearestCustomer.orderDetails}
                  </Text>
                </View>
              )}

              {nearestCustomer.deliveryPerson && (
                <View style={styles.deliveryInfo}>
                  <Ionicons name="person-outline" size={14} color="#6b7280" />
                  <Text style={styles.deliveryPerson}>
                    Assigned to: {nearestCustomer.deliveryPerson}
                  </Text>
                </View>
              )}

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.directionsButton}
                  onPress={() => openDirectionsInApp(nearestCustomer)}
                >
                  <Ionicons name="navigate" size={16} color="#fff" />
                  <Text style={styles.directionsButtonText}>Start</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    (nearestCustomer.status || "").toLowerCase() === "delivered"
                      ? styles.deliveredButton
                      : styles.pendingButton,
                  ]}
                  onPress={() => handleMarkDelivered(nearestCustomer._id)}
                >
                  <Text style={styles.statusButtonText}>
                    {(nearestCustomer.status || "").toLowerCase() ===
                    "delivered"
                      ? "Delivered"
                      : "Mark Delivered"}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* All Customers Card */}
        {!loading && !error && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                Delivery Schedule ({sortedCustomers.length})
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity
                  onPress={onRefresh}
                  style={styles.refreshButton}
                >
                  <Ionicons name="refresh" size={20} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={openAllCustomersMap}
                  style={[styles.refreshButton, { marginLeft: 8 }]}
                >
                  <Ionicons name="map" size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={18} color="#9ca3af" />
              <TextInput
                placeholder="Search deliveries by name, address, or details..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
                placeholderTextColor="#9ca3af"
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery("")}
                  style={styles.clearSearchButton}
                >
                  <Ionicons name="close-circle" size={20} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>

            {sortedCustomers.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="file-tray-outline" size={64} color="#d1d5db" />
                <Text style={styles.emptyStateTitle}>
                  {searchQuery
                    ? "No matching deliveries"
                    : "No deliveries scheduled"}
                </Text>
                <Text style={styles.emptyStateSubtitle}>
                  {searchQuery
                    ? "Try adjusting your search terms"
                    : "All deliveries have been completed or scheduled for later"}
                </Text>
              </View>
            ) : (
              sortedCustomers.map((customer, index) => {
                const distance = customer.distance;
                const hasCoordinates = customer.latitude && customer.longitude;

                return (
                  <TouchableOpacity
                    key={customer._id}
                    activeOpacity={0.8}
                    onPress={() => openDirectionsInApp(customer)}
                    style={[
                      styles.customerItem,
                      index < sortedCustomers.length - 1 &&
                        styles.customerItemBorder,
                    ]}
                  >
                    <Image
                      source={{ uri: getCustomerAvatar(customer) }}
                      style={styles.customerThumb}
                    />

                    <View style={styles.customerContent}>
                      <View style={styles.customerMainInfo}>
                        <Text style={styles.customerItemName}>
                          {customer.name}
                        </Text>
                        {distance != null && (
                          <Text
                            style={[
                              styles.customerDistance,
                              {
                                color: distance <= 100 ? "#10b981" : "#6b7280",
                              },
                            ]}
                          >
                            {distance}m
                          </Text>
                        )}
                      </View>

                      <Text style={styles.customerItemAddress}>
                        {customer.address}
                      </Text>

                      {(customer.orderDetails ||
                        customer.deliveryPerson ||
                        customer.phone) && (
                        <View style={styles.customerMeta}>
                          {(customer.orderDetails || customer.phone) && (
                            <View style={styles.metaRow}>
                              {customer.orderDetails ? (
                                <View style={styles.metaItem}>
                                  <Ionicons
                                    name="cube-outline"
                                    size={12}
                                    color="#6b7280"
                                  />
                                  <Text
                                    style={styles.metaText}
                                    numberOfLines={1}
                                  >
                                    {customer.orderDetails}
                                  </Text>
                                </View>
                              ) : (
                                <View style={{ flex: 1 }} />
                              )}

                              {customer.phone ? (
                                <Text
                                  style={styles.metaPhone}
                                  numberOfLines={1}
                                >
                                  📞 {customer.phone}
                                </Text>
                              ) : null}
                            </View>
                          )}

                          {customer.deliveryPerson && (
                            <View style={styles.metaItem}>
                              <Ionicons
                                name="person-outline"
                                size={12}
                                color="#6b7280"
                              />
                              <Text style={styles.metaText}>
                                {customer.deliveryPerson}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}

                      <View style={styles.customerFooter}>
                        <View
                          style={[
                            styles.statusIndicator,
                            {
                              backgroundColor:
                                (customer.status || "").toLowerCase() ===
                                "delivered"
                                  ? "#10b981"
                                  : (customer.status || "").toLowerCase() ===
                                    "cancelled"
                                  ? "#ef4444"
                                  : "#f59e0b",
                            },
                          ]}
                        >
                          <Text style={styles.statusText}>
                            {(customer.status || "pending").toUpperCase()}
                          </Text>
                        </View>

                        {hasCoordinates && (
                          <TouchableOpacity
                            style={styles.smallDirectionsButton}
                            onPress={() => openDirectionsInApp(customer)}
                          >
                            <Ionicons
                              name="navigate"
                              size={14}
                              color="#007AFF"
                            />
                            <Text style={styles.smallDirectionsText}>
                              Directions
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Location Popup Provider */}
      <LocationPopupProvider />

      {/* Success modal (flash) */}
      <Modal visible={successVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={48} color="#10b981" />
            </View>
            <Text style={styles.modalTitle}>Success</Text>
            <Text style={styles.modalMessage}>{successText}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleSuccessOk}
            >
              <Text style={styles.modalButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* All Stops Map Modal (Leaflet) */}
      <Modal
        visible={allMapsVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent={true}
      >
        <View style={styles.fullScreenContainer}>
          <View style={styles.mapsHeader}>
            <TouchableOpacity
              onPress={() => setAllMapsVisible(false)}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={24} color="#374151" />
            </TouchableOpacity>

            <View style={styles.mapsHeaderContent}>
              <Text style={styles.mapsHeaderTitle} numberOfLines={1}>
                All Stops
              </Text>
              <Text style={styles.mapsHeaderSubtitle} numberOfLines={1}>
                {sortedCustomers.length} active stops
              </Text>
            </View>

            <TouchableOpacity
              onPress={openAllInExternalMaps}
              style={styles.externalButton}
            >
              <Ionicons name="open-outline" size={22} color="#374151" />
            </TouchableOpacity>
          </View>

          {allWebViewLoading && !allMapError && (
            <View style={styles.webViewLoading}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.webViewLoadingText}>Loading map...</Text>
            </View>
          )}

          {allMapError && (
            <View style={styles.mapErrorContainer}>
              <Ionicons name="map-outline" size={64} color="#d1d5db" />
              <Text style={styles.mapErrorTitle}>Map Unavailable</Text>
              <Text style={styles.mapErrorMessage}>
                Unable to load the map. Check your connection or try external
                maps.
              </Text>
              <View style={styles.mapErrorButtons}>
                <TouchableOpacity
                  style={[styles.mapErrorButton, styles.primaryMapErrorButton]}
                  onPress={() => {
                    setAllMapError(false);
                    setAllWebViewLoading(true);
                  }}
                >
                  <Text style={styles.primaryMapErrorButtonText}>
                    Try Again
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.mapErrorButton,
                    styles.secondaryMapErrorButton,
                  ]}
                  onPress={openAllInExternalMaps}
                >
                  <Text style={styles.secondaryMapErrorButtonText}>
                    Open External
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <WebView
            source={{ html: generateAllCustomersMapHTML() }}
            style={[
              styles.webView,
              (allWebViewLoading || allMapError) && styles.hiddenWebView,
            ]}
            onLoadStart={handleAllWebViewLoadStart}
            onLoadEnd={handleAllWebViewLoadEnd}
            onError={handleAllWebViewError}
            onHttpError={handleAllWebViewError}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            mixedContentMode="compatibility"
          />

          <View style={styles.mapsActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryAction]}
              onPress={openAllInExternalMaps}
            >
              <Ionicons name="navigate" size={20} color="#fff" />
              <Text style={styles.primaryActionText}>Open in Google Maps</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryAction]}
              onPress={() => setAllMapsVisible(false)}
            >
              <Text style={styles.secondaryActionText}>Close Map</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Full Screen Google Maps Modal */}
      <Modal
        visible={mapsVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent={true}
      >
        <View style={styles.fullScreenContainer}>
          {/* Header */}
          {/* <View style={styles.mapsHeader}>
            <TouchableOpacity
              onPress={() => setMapsVisible(false)}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={24} color="#374151" />
            </TouchableOpacity>

            <View style={styles.mapsHeaderContent}>
              <Text style={styles.mapsHeaderTitle} numberOfLines={1}>
                {selectedCustomer?.name}
              </Text>
              <Text style={styles.mapsHeaderSubtitle} numberOfLines={1}>
                {selectedCustomer?.address}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                if (selectedCustomer) {
                  openInExternalApp(selectedCustomer);
                }
              }}
              style={styles.externalButton}
            >
              <Ionicons name="open-outline" size={22} color="#374151" />
            </TouchableOpacity>
          </View> */}

          {/* WebView Loading Indicator */}
          {webViewLoading && !mapError && (
            <View style={styles.webViewLoading}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.webViewLoadingText}>
                Loading directions...
              </Text>
            </View>
          )}

          {/* Map Error State */}
          {mapError && (
            <View style={styles.mapErrorContainer}>
              <Ionicons name="map-outline" size={64} color="#d1d5db" />
              <Text style={styles.mapErrorTitle}>Map Unavailable</Text>
              <Text style={styles.mapErrorMessage}>
                Unable to load Google Maps. Please check your connection or try
                using external maps.
              </Text>
              <View style={styles.mapErrorButtons}>
                <TouchableOpacity
                  style={[styles.mapErrorButton, styles.primaryMapErrorButton]}
                  onPress={() => {
                    setMapError(false);
                    setWebViewLoading(true);
                  }}
                >
                  <Text style={styles.primaryMapErrorButtonText}>
                    Try Again
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.mapErrorButton,
                    styles.secondaryMapErrorButton,
                  ]}
                  onPress={() => {
                    if (selectedCustomer) {
                      openInExternalApp(selectedCustomer);
                    }
                  }}
                >
                  <Text style={styles.secondaryMapErrorButtonText}>
                    Use External Maps
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Google Maps WebView */}
          <WebView
            source={{ html: generateMapsHTML() }}
            style={[
              styles.webView,
              (webViewLoading || mapError) && styles.hiddenWebView,
            ]}
            onLoadStart={handleWebViewLoadStart}
            onLoadEnd={handleWebViewLoadEnd}
            onError={handleWebViewError}
            onHttpError={handleWebViewError}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            mixedContentMode="compatibility"
            setBuiltInZoomControls={false}
            setDisplayZoomControls={false}
          />

          {/* Action Buttons */}
          <View style={styles.mapsActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryAction]}
              onPress={() => {
                if (selectedCustomer) {
                  openInExternalApp(selectedCustomer);
                }
              }}
            >
              <Ionicons name="navigate" size={20} color="#fff" />
              <Text style={styles.primaryActionText}>Open in Google Maps</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryAction]}
              onPress={() => setMapsVisible(false)}
            >
              <Text style={styles.secondaryActionText}>Close Directions</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    flex: 1,
  },
  // Header Styles
  header: {
    backgroundColor: "#007AFF",
    padding: 24,
    marginBottom: 16,
  },
  headerImage: {
    opacity: 0.9,
  },
  headerOverlay: {
    backgroundColor: "rgba(0, 122, 255, 0.9)",
    borderRadius: 16,
    padding: 20,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  logoContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // Card Styles
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "white",
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "white",
  },
  // Location Info
  locationInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  locationTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 13,
    color: "#1f2937",
    marginBottom: 4,
  },
  locationCoordinates: {
    fontSize: 12,
    color: "#6b7280",
  },
  // Loading States
  loadingContainer: {
    alignItems: "center",
    padding: 32,
  },
  loadingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#374151",
  },
  // Error States
  errorContainer: {
    alignItems: "center",
    padding: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 8,
  },
  // Featured Customer Card
  featuredCustomerCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  customerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  featuredCustomerThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: 12,
  },
  customerInfo: {
    flex: 1,
  },
  featuredCustomerName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1f2937",
    marginBottom: 4,
  },
  featuredCustomerAddress: {
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 18,
  },
  featuredCustomerPhone: {
    fontSize: 13,
    color: "#374151",
    marginTop: 6,
    fontWeight: "600",
  },
  distanceBadge: {
    backgroundColor: "#1f2937",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  distanceBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "white",
  },
  orderInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  orderDetails: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 8,
    flex: 1,
  },
  deliveryInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  deliveryPerson: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 8,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  directionsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 12,
    justifyContent: "center",
  },
  directionsButtonText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 8,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
  deliveredButton: {
    backgroundColor: "#10b981",
  },
  pendingButton: {
    backgroundColor: "#f59e0b",
  },
  statusButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  // Search Styles
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#374151",
    marginLeft: 12,
    marginRight: 8,
    paddingVertical: 6,
  },
  clearSearchButton: {
    padding: 4,
  },
  // Customer List Styles
  customerItem: {
    flexDirection: "row",
    paddingVertical: 16,
    alignItems: "flex-start",
  },
  customerItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  customerThumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 12,
  },
  customerContent: {
    flex: 1,
  },
  customerMainInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  customerItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    flex: 1,
  },
  customerDistance: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  customerItemAddress: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
    lineHeight: 18,
  },
  customerPhone: {
    fontSize: 13,
    color: "#374151",
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metaPhone: {
    fontSize: 13,
    color: "#374151",
    marginLeft: 12,
    maxWidth: "45%",
    textAlign: "right",
  },
  customerMeta: {
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 6,
  },
  customerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    color: "white",
  },
  smallDirectionsButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  smallDirectionsText: {
    color: "#007AFF",
    fontWeight: "600",
    marginLeft: 4,
    fontSize: 12,
  },
  // Empty State
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalBox: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  successIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  refreshButton: {
    padding: 8,
  },
  // Maps Modal Styles
  fullScreenContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  mapsHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  mapsHeaderContent: {
    flex: 1,
    marginRight: 12,
  },
  mapsHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 2,
  },
  mapsHeaderSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  externalButton: {
    padding: 8,
  },
  webView: {
    flex: 1,
    marginBottom: 96,
  },
  hiddenWebView: {
    display: "none",
  },
  webViewLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  webViewLoadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
  },
  mapErrorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: "#f8fafc",
  },
  mapErrorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    marginTop: 16,
    marginBottom: 8,
  },
  mapErrorMessage: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  mapErrorButtons: {
    flexDirection: "row",
    gap: 12,
  },
  mapErrorButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
  primaryMapErrorButton: {
    backgroundColor: "#007AFF",
  },
  secondaryMapErrorButton: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  primaryMapErrorButtonText: {
    color: "white",
    fontWeight: "600",
  },
  secondaryMapErrorButtonText: {
    color: "#374151",
    fontWeight: "600",
  },
  mapsActions: {
    paddingHorizontal: 20,
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 2,
    zIndex: 1100,
    backgroundColor: "transparent",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryAction: {
    backgroundColor: "#007AFF",
  },
  secondaryAction: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  primaryActionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  secondaryActionText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "500",
  },
});
