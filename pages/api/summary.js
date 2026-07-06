const { GoogleGenAI } = require('@google/genai');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { clickedLocation, hospital, publicOrg } = req.body;

  if (!clickedLocation || !hospital || !publicOrg) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  // 1. 데모 모드 판단
  // Google GCP 인증(ADC) 파일이 없거나 상용/인터넷(Vercel 등) 환경에서는 실제 API 호출을 차단하고 Mock 응답을 반환합니다.
  const isDemoMode = process.env.NODE_ENV === 'production' || !process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (isDemoMode) {
    const mockSummary = `### 📍 데모 모드 안내 (Demo Mode)
현재 환경은 인터넷 데모 환경이므로 실제 Google Vertex AI API를 호출하지 않고, 구조 파악을 돕기 위해 설계된 **가상 요약 리포트**를 출력합니다.

* **선택한 지점:** 위도 \`${clickedLocation.lat.toFixed(6)}\`, 경도 \`${clickedLocation.lng.toFixed(6)}\`
* **가장 가까운 병원:** **${hospital.name}** (직선거리 **${hospital.distance.toFixed(0)}m**)
* **가장 가까운 공공기관:** **${publicOrg.name}** (직선거리 **${publicOrg.distance.toFixed(0)}m**)

---

#### 🌟 인프라 접근성 평가 예시:
선택하신 위치는 가장 가까운 공공기관인 **'${publicOrg.name}'**까지 도보권 내에 매우 가깝게 인접해 있어, 주민 편의시설 이용 및 행정 처리가 극도로 편리합니다. 또한, 일상적인 의료 서비스를 신속하게 제공받을 수 있는 **'${hospital.name}'**이 직선거리 **${hospital.distance.toFixed(0)}m** 내에 위치하고 있어, 우수한 생활 인프라와 높은 주거 안정성을 자랑하는 입지 조건입니다.

> *※ 실제 로컬 개발 환경(인증 키 세팅 완료 시)에서는 아래의 Google Vertex AI(Gemini 3.5 Flash) 호출 로직이 정상 작동하여 실시간 생성형 요약본이 완성됩니다.*`;

    return res.status(200).json({ 
      summary: mockSummary,
      isDemo: true
    });
  }

  // 2. 실제 개발/검증용 로컬 실행 로직
  try {
    const ai = new GoogleGenAI({
      vertexai: true,
      project: process.env.GCP_PROJECT_ID || "your-gcp-project-id",
      location: "us"
    });

    const prompt = `
사용자가 서울특별시 관악구 대학동 지도에서 다음 위치를 클릭했습니다.
클릭한 위치: 위도 ${clickedLocation.lat.toFixed(6)}, 경도 ${clickedLocation.lng.toFixed(6)}

가장 가까운 병원:
- 이름: ${hospital.name}
- 주소: ${hospital.address}
- 직선거리: ${hospital.distance.toFixed(0)}m

가장 가까운 공공기관:
- 이름: ${publicOrg.name}
- 주소: ${publicOrg.address}
- 직선거리: ${publicOrg.distance.toFixed(0)}m

이 두 시설까지의 직선거리 정보를 바탕으로, 해당 클릭 위치 주변의 거주/생활 편의성과 접근성을 한글로 요약하여 정리해 주세요. (가독성 높은 마크다운 형식으로 작성해 주시고, 3-4문장 이내로 명확하고 전문적으로 요약해 주세요.)
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt
    });

    return res.status(200).json({ summary: response.text });
  } catch (error) {
    console.error('Vertex AI API Error:', error);
    return res.status(500).json({ error: 'AI 요약 생성 중 오류가 발생했습니다: ' + error.message });
  }
}
