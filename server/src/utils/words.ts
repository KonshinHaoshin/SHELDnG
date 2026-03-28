import * as fs from "fs";
import * as path from "path";

let zhWords: string[] = [];
let enWords: string[] = [];

function loadWords(lang: "zh" | "en"): string[] {
  const filename = lang === "zh" ? "zh.txt" : "en.txt";
  const filePath = path.join(process.cwd(), "words", filename);
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return content
      .split("\n")
      .map((w) => w.trim())
      .filter((w) => w.length > 0);
  } catch {
    console.warn(`Could not load words from ${filePath}`);
    return lang === "zh" ? defaultZhWords : defaultEnWords;
  }
}

export function getWordList(lang: "zh" | "en"): string[] {
  if (lang === "zh") {
    if (!zhWords.length) zhWords = loadWords("zh");
    return zhWords;
  } else {
    if (!enWords.length) enWords = loadWords("en");
    return enWords;
  }
}

export function getRandomWords(
  lang: "zh" | "en",
  count: number,
  customWords: string[] = []
): string[] {
  const pool = [...customWords, ...getWordList(lang)];
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function maskWord(word: string): string {
  return word
    .split("")
    .map((ch) => (ch === " " ? " " : "_"))
    .join(" ")
    .replace(/ {3}/g, "   ");
}

export function revealLetter(
  word: string,
  current: string,
  count: number
): string {
  // current is the space-separated hint like "_ _ _ _"
  const wordChars = word.split("");
  const hintChars = current.replace(/   /g, " ").split(" ");

  // Find hidden positions
  const hidden: number[] = [];
  for (let i = 0; i < wordChars.length; i++) {
    if (wordChars[i] !== " " && hintChars[i] === "_") {
      hidden.push(i);
    }
  }

  let revealed = [...hintChars];
  for (let i = 0; i < count && hidden.length > 0; i++) {
    const idx = hidden.splice(
      Math.floor(Math.random() * hidden.length),
      1
    )[0];
    revealed[idx] = wordChars[idx];
  }

  return revealed.join(" ").replace(/ {3}/g, "   ");
}

// Levenshtein edit distance
export function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

// Default fallback word lists
const defaultZhWords = [
  "苹果", "香蕉", "葡萄", "西瓜", "草莓", "橙子", "菠萝", "芒果",
  "猫", "狗", "兔子", "熊猫", "老虎", "狮子", "大象", "长颈鹿",
  "汽车", "飞机", "轮船", "火车", "自行车", "摩托车", "直升机", "火箭",
  "苹果电脑", "手机", "平板", "键盘", "鼠标", "耳机", "相机", "电视",
  "足球", "篮球", "乒乓球", "羽毛球", "网球", "高尔夫", "棒球", "排球",
  "太阳", "月亮", "星星", "彩虹", "闪电", "雪花", "云朵", "风",
  "书", "铅笔", "钢笔", "橡皮", "尺子", "剪刀", "胶水", "画笔",
  "房子", "学校", "医院", "超市", "餐厅", "公园", "图书馆", "银行",
  "山", "河流", "大海", "沙漠", "森林", "草地", "瀑布", "湖泊",
  "玫瑰", "向日葵", "荷花", "樱花", "梅花", "百合", "兰花", "菊花",
  "面条", "饺子", "包子", "米饭", "火锅", "烤鸭", "糖醋鱼", "宫保鸡丁",
  "电影", "音乐", "舞蹈", "绘画", "雕塑", "摄影", "书法", "戏剧",
  "春天", "夏天", "秋天", "冬天", "早晨", "中午", "傍晚", "夜晚",
  "快乐", "悲伤", "愤怒", "惊讶", "害怕", "厌恶", "期待", "满足",
  "警察", "医生", "老师", "厨师", "消防员", "宇航员", "工程师", "艺术家",
];

const defaultEnWords = [
  "apple", "banana", "grape", "watermelon", "strawberry", "orange",
  "cat", "dog", "rabbit", "panda", "tiger", "lion", "elephant", "giraffe",
  "car", "airplane", "ship", "train", "bicycle", "motorcycle", "helicopter",
  "computer", "phone", "tablet", "keyboard", "mouse", "headphones", "camera",
  "football", "basketball", "tennis", "volleyball", "golf", "baseball",
  "sun", "moon", "star", "rainbow", "lightning", "snowflake", "cloud",
  "book", "pencil", "pen", "eraser", "ruler", "scissors", "glue",
  "house", "school", "hospital", "supermarket", "restaurant", "park",
  "mountain", "river", "ocean", "desert", "forest", "waterfall", "lake",
  "rose", "sunflower", "lotus", "cherry blossom", "lily", "orchid",
  "pizza", "burger", "sushi", "tacos", "pasta", "steak", "salad",
  "guitar", "piano", "drums", "violin", "trumpet", "flute", "saxophone",
  "spring", "summer", "autumn", "winter", "morning", "noon", "evening", "night",
  "happy", "sad", "angry", "surprised", "scared", "disgusted", "excited",
  "police", "doctor", "teacher", "chef", "firefighter", "astronaut", "engineer",
  "bridge", "castle", "lighthouse", "temple", "pyramid", "skyscraper", "tunnel",
  "butterfly", "eagle", "penguin", "dolphin", "shark", "octopus", "jellyfish",
  "diamond", "crown", "sword", "shield", "magic wand", "potion", "treasure chest",
];
