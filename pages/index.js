import { useState, useEffect } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { MapPin, Navigation, Building2, Stethoscope, Sparkles, RefreshCw } from 'lucide-react';

// Dynamic import Leaflet map component with SSR disabled because Leaflet uses 'window' object
const Map = dynamic(() => import('../components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[450px] bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
      <div className="flex flex-col items-center space-y-3">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="text-gray-500 font-medium">지도를 불러오는 중입니다...</span>
      </div>
    </div>
  ),
});

// Initial coordinates for Jung-gu, Seoul (서울 중구 중심부)
const JUNG_GU_CENTER = { lat: 37.5635, lng: 126.9830 };
const DAEHAK_DONG_CENTER = { lat: 37.469389, lng: 126.935105 };

// Haversine formula to calculate straight line distance in meters
function getHaversineDistance(coords1, coords2) {
  const R = 6371000; // Radius of the Earth in meters
  const dLat = ((coords2.lat - coords1.lat) * Math.PI) / 180;
  const dLng = ((coords2.lng - coords1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coords1.lat * Math.PI) / 180) *
      Math.cos((coords2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function Home() {
  const [facilities, setFacilities] = useState([]);
  const [mapCenter, setMapCenter] = useState(JUNG_GU_CENTER);
  const [mapZoom, setMapZoom] = useState(13); // 중구 전체가 보일 수준의 확대 레벨
  const [clickedLocation, setClickedLocation] = useState(null);
  const [nearestHospital, setNearestHospital] = useState(null);
  const [nearestPublic, setNearestPublic] = useState(null);
  const [aiSummary, setAiSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [isDaehakDongView, setIsDaehakDongView] = useState(false);

  // Fetch mock facilities JSON
  useEffect(() => {
    fetch('/facilities.json')
      .then((res) => res.json())
      .then((data) => setFacilities(data))
      .catch((err) => console.error('Failed to load facilities data:', err));
  }, []);

  const handleMapClick = async (latlng) => {
    setClickedLocation(latlng);
    setAiSummary('');

    // Separate hospitals and public organizations
    const hospitals = facilities.filter((f) => f.type === 'hospital');
    const publicOrgs = facilities.filter((f) => f.type === 'public');

    // Find nearest hospital
    let minHospitalDist = Infinity;
    let closestHospital = null;
    hospitals.forEach((h) => {
      const dist = getHaversineDistance(latlng, h);
      if (dist < minHospitalDist) {
        minHospitalDist = dist;
        closestHospital = { ...h, distance: dist };
      }
    });

    // Find nearest public org
    let minPublicDist = Infinity;
    let closestPublic = null;
    publicOrgs.forEach((p) => {
      const dist = getHaversineDistance(latlng, p);
      if (dist < minPublicDist) {
        minPublicDist = dist;
        closestPublic = { ...p, distance: dist };
      }
    });

    setNearestHospital(closestHospital);
    setNearestPublic(closestPublic);

    // Call API for AI summary from Vertex AI
    if (closestHospital && closestPublic) {
      setLoadingSummary(true);
      try {
        const response = await fetch('/api/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clickedLocation: latlng,
            hospital: closestHospital,
            publicOrg: closestPublic,
          }),
        });
        const result = await response.json();
        if (result.summary) {
          setAiSummary(result.summary);
        } else {
          setAiSummary(result.error || 'AI 요약을 생성하지 못했습니다.');
        }
      } catch (error) {
        setAiSummary('요약 서비스 호출 중 오류가 발생했습니다.');
      } finally {
        setLoadingSummary(false);
      }
    }
  };

  const moveToDaehakDong = () => {
    setMapCenter(DAEHAK_DONG_CENTER);
    setMapZoom(16); // Close up for Daehak-dong
    setIsDaehakDongView(true);
  };

  const resetToJungGu = () => {
    setMapCenter(JUNG_GU_CENTER);
    setMapZoom(13);
    setClickedLocation(null);
    setNearestHospital(null);
    setNearestPublic(null);
    setAiSummary('');
    setIsDaehakDongView(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12">
      <Head>
        <title>관악구 대학동 생활 안전 인프라 MVP</title>
        <meta name="description" content="대학동 주변 병원 및 공공기관 신속 탐색 및 AI 요약 MVP" />
      </Head>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">대학동 인프라 맵 MVP</h1>
              <p className="text-xs text-gray-500">관악구 대학동 병원 & 공공기관 인프라 분석 및 AI 환경 요약</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!isDaehakDongView ? (
              <button
                onClick={moveToDaehakDong}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
              >
                대학동 지도로 이동
              </button>
            ) : (
              <button
                onClick={resetToJungGu}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg transition-colors border border-gray-300"
              >
                초기화 (중구 이동)
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 mt-6">
        {/* Banner Alert for Guide */}
        {!isDaehakDongView && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg mb-6 shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <MapPin className="h-5 h-5 text-yellow-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700 font-medium">
                  현재 지도는 요구사항에 따라 <strong>서울 중구 중심부</strong>를 가리키고 있습니다.<br />
                  상단의 <strong className="text-indigo-700">"대학동 지도로 이동"</strong> 버튼을 클릭하여 관악구 대학동으로 지도를 확대한 후 지도를 클릭해보세요!
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / Middle Column: Map Area */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <h2 className="font-semibold text-gray-800 text-base">실시간 위치 탐색 지도</h2>
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {isDaehakDongView ? '관악구 대학동 뷰' : '서울 중구 중심 뷰'}
                </span>
              </div>
              
              {/* Actual Map component wrapper */}
              <div className="relative shadow-inner">
                <Map
                  center={mapCenter}
                  zoom={mapZoom}
                  onMapClick={handleMapClick}
                  clickedLocation={clickedLocation}
                  nearestHospital={nearestHospital}
                  nearestPublic={nearestPublic}
                />
              </div>
              
              <div className="mt-3 text-xs text-gray-500 flex justify-between">
                <span>📍 지도 위 아무 곳이나 클릭하여 핀을 생성하세요.</span>
                <span className="flex space-x-3">
                  <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-1 inline-block"></span>클릭 위치</span>
                  <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 mr-1 inline-block"></span>병원</span>
                  <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-1 inline-block"></span>공공기관</span>
                </span>
              </div>
            </div>

            {/* AI Environmental Summary Section */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center space-x-2 mb-3">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <h3 className="font-semibold text-gray-800 text-lg">Google Vertex AI 입지 환경 분석</h3>
              </div>
              
              {loadingSummary ? (
                <div className="py-8 flex flex-col items-center justify-center space-y-2">
                  <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
                  <span className="text-sm text-gray-500">Vertex AI가 주거 환경 요약 분석을 생성 중입니다...</span>
                </div>
              ) : aiSummary ? (
                <div className="bg-indigo-50/50 rounded-lg p-4 border border-indigo-100 text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                  {aiSummary}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  대학동 지도 위의 한 지점을 클릭하시면 해당 위치를 기반으로 한 Vertex AI 환경 요약 정리서가 실시간으로 제공됩니다.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Information panel */}
          <div className="space-y-6">
            {/* Clicked Coordinate */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">선택한 위치 정보</h3>
              {clickedLocation ? (
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-red-100 rounded-lg text-red-600 mt-1">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">지도 선택 위치</p>
                    <div className="mt-1 text-sm text-gray-600 space-y-0.5">
                      <p><span className="font-medium text-gray-400">위도:</span> {clickedLocation.lat.toFixed(6)}</p>
                      <p><span className="font-medium text-gray-400">경도:</span> {clickedLocation.lng.toFixed(6)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-lg border border-dashed">
                  지도 위를 클릭하면 좌표가 표시됩니다.
                </div>
              )}
            </div>

            {/* Nearest Hospital Card */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">가장 가까운 병원/의원</h3>
              {nearestHospital ? (
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600 mt-1">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-base">{nearestHospital.name}</p>
                      <div className="mt-1 text-sm text-gray-600 space-y-0.5">
                        <p><span className="font-semibold text-purple-600">직선거리:</span> {nearestHospital.distance.toFixed(0)}m</p>
                        <p className="text-xs text-gray-500 mt-1 leading-normal"><span className="font-medium text-gray-400">주소:</span> {nearestHospital.address}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-lg border border-dashed">
                  지도를 선택하시면 즉시 계산됩니다.
                </div>
              )}
            </div>

            {/* Nearest Public Org Card */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">가장 가까운 공공기관</h3>
              {nearestPublic ? (
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600 mt-1">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-base">{nearestPublic.name}</p>
                      <div className="mt-1 text-sm text-gray-600 space-y-0.5">
                        <p><span className="font-semibold text-blue-600">직선거리:</span> {nearestPublic.distance.toFixed(0)}m</p>
                        <p className="text-xs text-gray-500 mt-1 leading-normal"><span className="font-medium text-gray-400">주소:</span> {nearestPublic.address}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-lg border border-dashed">
                  지도를 선택하시면 즉시 계산됩니다.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-400">
        <p>© 2026 Gwanak Daehak-dong Infra MVP. All rights reserved.</p>
        <p className="mt-1">Powered by Next.js, OpenStreetMap, Leaflet & Google Vertex AI (Gemini 3.5 Flash)</p>
      </footer>
    </div>
  );
}
