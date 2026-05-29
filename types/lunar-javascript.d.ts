declare module "lunar-javascript" {
  export class EightChar {
    getYear(): string;
    getMonth(): string;
    getDay(): string;
    getTime(): string;
    getYearGan(): string;
    getMonthGan(): string;
    getDayGan(): string;
    getTimeGan(): string;
    getYearZhi(): string;
    getMonthZhi(): string;
    getDayZhi(): string;
    getTimeZhi(): string;
    getYearWuXing(): string;
    getMonthWuXing(): string;
    getDayWuXing(): string;
    getTimeWuXing(): string;
    getYearNaYin(): string;
    getMonthNaYin(): string;
    getDayNaYin(): string;
    getTimeNaYin(): string;
    getYearShiShenGan(): string;
    getMonthShiShenGan(): string;
    getTimeShiShenGan(): string;
    getYearShiShenZhi(): string[];
    getMonthShiShenZhi(): string[];
    getDayShiShenZhi(): string[];
    getTimeShiShenZhi(): string[];
    /** 대운(大運) 계산. gender: 1=남, 0=여 (lunar-javascript 규약) */
    getYun(gender: number): Yun;
  }

  export class Yun {
    getStartYear(): number;
    getDaYun(): DaYun[];
  }

  export class DaYun {
    getStartAge(): number;
    getEndAge(): number;
    getStartYear(): number;
    getGanZhi(): string;
  }

  export class Lunar {
    static fromYmdHms(y: number, m: number, d: number, h: number, mi: number, s: number): Lunar;
    getEightChar(): EightChar;
    getYearShengXiao(): string;
    getSolar(): Solar;
  }

  export class Solar {
    static fromYmdHms(y: number, m: number, d: number, h: number, mi: number, s: number): Solar;
    getLunar(): Lunar;
  }
}
