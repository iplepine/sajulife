export const GAN_KO: Record<string, string> = {
  "甲": "갑", "乙": "을", "丙": "병", "丁": "정", "戊": "무",
  "己": "기", "庚": "경", "辛": "신", "壬": "임", "癸": "계",
};

export const ZHI_KO: Record<string, string> = {
  "子": "자", "丑": "축", "寅": "인", "卯": "묘", "辰": "진", "巳": "사",
  "午": "오", "未": "미", "申": "신", "酉": "유", "戌": "술", "亥": "해",
};

export const WUXING_KO: Record<string, string> = {
  "木": "목", "火": "화", "土": "토", "金": "금", "水": "수",
};

export const SHENGXIAO_KO: Record<string, string> = {
  "鼠": "쥐", "牛": "소", "虎": "범", "兔": "토끼", "龙": "용", "蛇": "뱀",
  "马": "말", "羊": "양", "猴": "원숭이", "鸡": "닭", "狗": "개", "猪": "돼지",
};

export const GAN_TO_WUXING: Record<string, string> = {
  "甲": "木", "乙": "木", "丙": "火", "丁": "火",
  "戊": "土", "己": "土", "庚": "金", "辛": "金",
  "壬": "水", "癸": "水",
};

export const ZHI_TO_WUXING: Record<string, string> = {
  "子": "水", "亥": "水", "寅": "木", "卯": "木",
  "巳": "火", "午": "火", "申": "金", "酉": "金",
  "辰": "土", "戌": "土", "丑": "土", "未": "土",
};

export const GAN_YINYANG: Record<string, "양" | "음"> = {
  "甲": "양", "乙": "음", "丙": "양", "丁": "음", "戊": "양",
  "己": "음", "庚": "양", "辛": "음", "壬": "양", "癸": "음",
};

export function toKoreanPillar(pillar: string): string {
  if (pillar.length !== 2) return pillar;
  const [g, z] = [pillar[0], pillar[1]];
  return `${GAN_KO[g] ?? g}${ZHI_KO[z] ?? z}(${pillar})`;
}
