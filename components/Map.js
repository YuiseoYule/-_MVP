import React, { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon issues in Next.js/React
const setupLeafletIcons = () => {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};

// Colored markers using SVG for different types
const createColoredIcon = (color) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const clickIcon = createColoredIcon('red');       // Clicked point
const hospitalIcon = createColoredIcon('violet');  // Nearest Hospital
const publicIcon = createColoredIcon('blue');      // Nearest Public Org

// Map controller to set view programmatically
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

// Map clicks handler
function MapEvents({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

export default function Map({ center, zoom, onMapClick, clickedLocation, nearestHospital, nearestPublic }) {
  useEffect(() => {
    setupLeafletIcons();
  }, []);

  return (
    <div className="w-full relative" style={{ height: '450px' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: '100%', height: '100%', borderRadius: '0.75rem', overflow: 'hidden' }}
        scrollWheelZoom={true}
      >
        <ChangeView center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents onMapClick={onMapClick} />

        {/* Clicked location marker */}
        {clickedLocation && (
          <Marker position={[clickedLocation.lat, clickedLocation.lng]} icon={clickIcon}>
            <Popup>
              <div className="text-xs font-semibold text-gray-800">
                선택한 지점<br />
                ({clickedLocation.lat.toFixed(6)}, {clickedLocation.lng.toFixed(6)})
              </div>
            </Popup>
          </Marker>
        )}

        {/* Nearest Hospital marker */}
        {nearestHospital && (
          <Marker position={[nearestHospital.lat, nearestHospital.lng]} icon={hospitalIcon}>
            <Popup>
              <div className="text-xs">
                <span className="font-bold text-purple-700">[가장 가까운 병원]</span><br />
                <strong className="block text-sm mt-1">{nearestHospital.name}</strong>
                거리: {nearestHospital.distance.toFixed(0)}m<br />
                주소: {nearestHospital.address}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Nearest Public Org marker */}
        {nearestPublic && (
          <Marker position={[nearestPublic.lat, nearestPublic.lng]} icon={publicIcon}>
            <Popup>
              <div className="text-xs">
                <span className="font-bold text-blue-700">[가장 가까운 공공기관]</span><br />
                <strong className="block text-sm mt-1">{nearestPublic.name}</strong>
                거리: {nearestPublic.distance.toFixed(0)}m<br />
                주소: {nearestPublic.address}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
