// 화면2: 기업 기본정보. "가입 때 한 번 입력하면 서류 상단 항목에 자동으로
// 채워 넣는다"는 설계 의도인데, 아직 인증/DB가 없어서 지금은 이 브라우저의
// localStorage에만 저장한다. 나중에 로그인이 생기면 서버측 사용자별 저장으로
// 옮겨야 한다(그때까지는 기기를 바꾸면 다시 입력해야 하는 한계가 있음).

export type CompanyProfile = {
  companyName: string;
  industry: string;
  employeeCount: number | null;
  prefecture: string;
  establishedYear: number | null;
  annualRevenue: number | null; // 円
  representativeName: string;
  updatedAt: string;
};

const STORAGE_KEY = "jgrants_company_profile";

export function loadCompanyProfile(): CompanyProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CompanyProfile;
  } catch {
    return null;
  }
}

export function saveCompanyProfile(profile: Omit<CompanyProfile, "updatedAt">): CompanyProfile {
  const full: CompanyProfile = { ...profile, updatedAt: new Date().toISOString() };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
  } catch {
    // localStorage 접근 불가 환경(프라이빗 모드 등)이면 저장은 스킵하고 값만 반환
  }
  return full;
}

export function clearCompanyProfile(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}

export const INDUSTRY_OPTIONS = [
  "製造業",
  "建設業",
  "卸売業",
  "小売業",
  "情報通信業",
  "運輸業",
  "宿泊業・飲食サービス業",
  "サービス業",
  "その他",
];

export const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
];
