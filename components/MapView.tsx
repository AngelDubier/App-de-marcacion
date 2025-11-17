import React, { useEffect, useRef } from 'react';

// Since we are loading Leaflet via CDN, we can declare the L global variable.
declare const L: any;

interface MapViewProps {
  center: [number, number];
  zoom?: number;
  markerText?: string;
}

const MapView: React.FC<MapViewProps> = ({ center, zoom = 15, markerText }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      // Initialize map
      mapInstanceRef.current = L.map(mapContainerRef.current).setView(center, zoom);

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);
    }
    
    if (mapInstanceRef.current) {
        // Update map view and marker position if center changes
        mapInstanceRef.current.setView(center, zoom);
        
        // Add or update marker
        const marker = L.marker(center).addTo(mapInstanceRef.current);
        if (markerText) {
            marker.bindPopup(markerText).openPopup();
        }
    }
  }, [center, zoom, markerText]);

  return <div ref={mapContainerRef} className="leaflet-container z-0" />;
};

export default MapView;
