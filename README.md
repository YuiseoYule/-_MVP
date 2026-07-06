# 📍 관악구 대학동 생활 안전 인프라 맵 (MVP)

이 프로젝트는 **서울특별시 관악구 대학동**을 중심으로 주변 필수 생활 안전 인프라(병원, 공공기관)의 접근성을 실시간으로 확인하고, AI 분석을 통해 입지 편리성을 요약해 주는 지도 기반의 웹 서비스 MVP(Minimum Viable Product)입니다.

---

## 🌟 프로젝트 소개 (App Description)

본 애플리케이션은 사용자가 지도상의 특정 위치를 클릭했을 때, 해당 지점으로부터 **가장 가까운 병의원 및 공공기관(주민센터, 치안센터 등)을 신속하게 탐색**합니다. 또한, 자체 계산된 직선거리를 토대로 **Google Vertex AI(Gemini 3.5 Flash)** 모델이 해당 입지 여건을 종합 분석하여 직관적이고 친절한 거주 환경 요약 보고서를 제공합니다.

### 💡 주요 기능
- **대학동 특화 데이터 활용**: 미리 정제된 대학동 내 12개의 핵심 병의원 및 공공기관 실좌표 JSON 데이터를 기반으로 신속하게 연동합니다.
- **실시간 최단 거리 계산**: Haversine Formula 공식을 사용하여 클릭 지점부터 각 인프라까지의 직선거리를 정확하게 계산합니다.
- **인프라 마커 시각화**: 클릭 위치(빨간색), 가장 가까운 병원(보라색), 가장 가까운 공공기관(파란색)을 직관적으로 구분하여 지도에 표출합니다.
- **Google Vertex AI 기반 입지 요약**: AI가 인프라 접근성을 전문적으로 종합 분석하여 3-4문장 이내의 요약 리포트를 동적으로 생성합니다. (※ 인터넷 데모 환경에서는 Mock 데이터로 유연하게 대체 작동합니다.)

---

## ⚠️ 중요 사용 안내 (Usage Notice)

> 🚨 **본 MVP 서비스는 원활한 자원 활용 및 목적 집중을 위해 오직 '관악구 대학동' 구역에 대해서만 데이터가 구성되어 작동합니다!**  
> 서비스를 정상적으로 테스트하고 기능을 확인하시려면, 접속 후 우측 상단의 **`[대학동 지도로 이동]`** 버튼을 눌러 지도 시점을 관악구 대학동으로 먼저 이동하신 뒤 지도를 클릭해 주세요!

---

## 🛠️ 기술 스택 (Tech Stack)

- **Frontend Framework**: Next.js (Pages Router) + TailwindCSS
- **Map Library**: Leaflet & react-leaflet + OpenStreetMap API
- **Icons**: Lucide React
- **AI Integration**: @google/genai (GCP Vertex AI)

---

## 🚀 시작하기 (Getting Started)

### 1. 개발 서버 실행

의존성 패키지를 설치한 후, 로컬 개발 서버를 구동합니다.

```bash
# 의존성 패키지 설치
npm install

# 개발 서버 구동
npm run dev
# 또는
yarn dev
# 또는
pnpm dev
```

브라우저를 열고 [http://localhost:3000](http://localhost:3000)으로 접속하여 결과를 확인하세요.

### 2. 환경 변수 설정 (옵션 - 로컬 AI 연동용)

실제 Google Vertex AI를 활용하여 요약 보고서 생성을 원하시면 프로젝트 루트에 `.env.local` 파일을 생성하고 아래와 같이 GCP 설정을 추가하세요. (입력하지 않으면 자동으로 데모 모드로 전환되어 가상 요약본이 안전하게 로출됩니다.)

```env
GCP_PROJECT_ID=your-gcp-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/gcp-credentials.json
```

---

## 🌐 배포 (Deployment)

이 프로젝트는 [Vercel 플랫폼](https://vercel.com/new)을 통해 가장 쉽고 간편하게 배포할 수 있습니다.
배포와 관련된 상세 설명은 [Next.js 배포 문서](https://nextjs.org/docs/pages/building-your-application/deploying)를 참고하세요.
