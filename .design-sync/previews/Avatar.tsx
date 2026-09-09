import { Avatar } from "@/shared/components/Avatar";

// 카카오/네이버 프로필 이미지를 대신할 자리표시 이미지 - 실제 소셜 로그인
// 사용자의 사진을 가져다 쓸 수는 없어서, 원형으로 잘렸을 때 자연스러운
// 인물 실루엣 형태의 SVG를 데이터 URI로 직접 만들어 씀(더미 텍스트 아님,
// Avatar가 실제로 받는 것과 같은 이미지 URL 문자열).
const PLACEHOLDER_PHOTO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='#1a8ecb'/><circle cx='50' cy='38' r='18' fill='#ffffff'/><path d='M14 96 Q50 54 86 96 Z' fill='#ffffff'/></svg>`,
  );

// UserMenu가 헤더에서 쓰는 기본 크기(24px) - 소셜 로그인에서 프로필 이미지
// 제공에 동의하지 않았거나 비로그인 상태일 때 실제로 자주 나타나는 폴백:
// 이름 첫 글자 대신 사람 실루엣 아이콘으로 대체 표시함.
export function HeaderFallback() {
  return <Avatar name="지민맘" size={24} />;
}

// CampaignApplicantsPage의 신청자 목록 항목(36px) - 프로필 이미지가 있는 경우.
export function ApplicantWithPhoto() {
  return <Avatar src={PLACEHOLDER_PHOTO} name="지민맘" size={36} />;
}

// CampaignCard 안에 들어가는 주최자 아바타(16px) - 카드 안 작은 텍스트
// 옆이라 가장 작게 쓰이는 크기. 아이콘도 size에 비례해서 같이 줄어듦.
export function CardOwnerSmall() {
  return <Avatar name="host_account" size={16} />;
}

// 기본값(props 없이) - size 기본 20px, src/name 둘 다 없는 완전한 비로그인
// 상태의 최소 형태.
export function Default() {
  return <Avatar />;
}
