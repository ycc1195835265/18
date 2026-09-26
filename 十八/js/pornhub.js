/**
 * Pornhub ForwardWidget v3.5.1
 * 列表 type:"url" + link → loadDetail(link)
 * 播放：loadDetail 填 videoUrl；多画质走 type:"stream" 的 loadResource
 * 分类使用数字 ID，避免 404
 */
WidgetMetadata = {
  id: "forward.pornhub.tut",
  title: "Pornhub",
  version: "3.5.1",
  requiredVersion: "0.0.1",
  description: "Pornhub 热门/最新/分类/搜索，详情页提取真实 HLS 播放地址 | 频道：https://t.me/nostremby",
  author: "宝宝巴士",
  site: "https://t.me/nostremby",
  detailCacheDuration: 300,
  modules: [
    {
      id: "loadHot",
      title: "热门视频",
      functionName: "loadHot",
      cacheDuration: 600,
      params: [{ name: "page", title: "页码", type: "page" }]
    },
    {
      id: "loadNewest",
      title: "最新上传",
      functionName: "loadNewest",
      cacheDuration: 600,
      params: [{ name: "page", title: "页码", type: "page" }]
    },
    {
      id: "loadMostViewed",
      title: "最多观看",
      functionName: "loadMostViewed",
      cacheDuration: 600,
      params: [{ name: "page", title: "页码", type: "page" }]
    },
    {
      id: "loadTopRated",
      title: "最高评分",
      functionName: "loadTopRated",
      cacheDuration: 600,
      params: [{ name: "page", title: "页码", type: "page" }]
    },
    {
      id: "loadCategory",
      title: "分类",
      functionName: "loadCategory",
      cacheDuration: 600,
      params: [
        { name: "page", title: "页码", type: "page" },
        {
          name: "category",
          title: "分类",
          type: "enumeration",
          value: "111",
          enumOptions: [
            { title: "日本", value: "111" },
            { title: "亚洲", value: "1" },
            { title: "业余", value: "3" },
            { title: "大屁股", value: "4" },
            { title: "巨乳", value: "8" },
            { title: "金发", value: "9" },
            { title: "棕发", value: "11" },
            { title: "口交", value: "13" },
            { title: "内射", value: "15" },
            { title: "颜射", value: "16" },
            { title: "黑人", value: "17" },
            { title: "硬核", value: "21" },
            { title: "玩具", value: "23" },
            { title: "公开", value: "24" },
            { title: "黑人白人", value: "25" },
            { title: "拉丁", value: "26" },
            { title: "女同", value: "27" },
            { title: "熟女 Mature", value: "28" },
            { title: "MILF", value: "29" },
            { title: "肛交", value: "35" },
            { title: "POV", value: "41" },
            { title: "红发", value: "42" },
            { title: "三人行", value: "65" },
            { title: "潮吹", value: "69" },
            { title: "按摩", value: "78" },
            { title: "轮奸", value: "80" },
            { title: "卡通", value: "86" },
            { title: "独家", value: "115" },
            { title: "认证业余", value: "138" },
            { title: "小胸", value: "59" },
            { title: "独奏女", value: "492" },
            { title: "60FPS", value: "105" },
            { title: "热门女性", value: "path:/popularwithwomen" },
            { title: "Teen", value: "path:/categories/teen" },
            { title: "HD", value: "path:/hd" },
            { title: "VR", value: "path:/vr" },
            { title: "Hentai", value: "path:/categories/hentai" }
          ]
        }
      ]
    },
    {
      id: "loadResource",
      title: "加载播放资源",
      functionName: "loadResource",
      type: "stream",
      params: []
    }
  ],
  search: {
    title: "搜索",
    functionName: "search",
    params: [
      { name: "keyword", title: "关键词", type: "input" },
      { name: "page", title: "页码", type: "page" },
      {
        name: "sort",
        title: "排序",
        type: "enumeration",
        value: "",
        enumOptions: [
          { title: "最相关", value: "" },
          { title: "最多观看", value: "mv" },
          { title: "最高评分", value: "tr" },
          { title: "最长", value: "lg" },
          { title: "最新", value: "mr" }
        ]
      }
    ]
  }
};

const BASE_URL = "https://www.pornhub.com";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
const HEADERS = {
  "User-Agent": UA,
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Referer": "https://www.pornhub.com/",
  "Cookie": "platform=pc; age_verified=1; accessAgeDisclaimerPH=1"
};

function getText(v) {
  return String(v || "").trim();
}

function isCF(html) {
  return /Just a moment|cf-browser-verification|challenge-platform/i.test(html || "");
}

async function fetchHtml(url) {
  const res = await Widget.http.get(url, { headers: HEADERS });
  const html = res && res.data ? res.data : "";
  if (isCF(html)) throw new Error("Cloudflare 拦截，请稍后重试");
  if (!html) throw new Error("页面为空");
  return html;
}

function extractViewkey(s) {
  const m = String(s || "").match(/viewkey=([a-zA-Z0-9]+)/i);
  return m ? m[1] : "";
}

function absUrl(u) {
  u = getText(u);
  if (!u) return "";
  if (u.startsWith("//")) return "https:" + u;
  if (u.startsWith("/")) return "https://www.pornhub.com" + u;
  return u;
}

function pickCoverFromCard(cardHtml) {
  function attr(name) {
    const m = cardHtml.match(new RegExp(name + '="([^"]+)"', "i"));
    return m ? m[1] : "";
  }
  const candidates = [
    attr("data-mediumthumb"),
    attr("data-image"),
    attr("data-src"),
    attr("src")
  ];
  for (let i = 0; i < candidates.length; i++) {
    let u = absUrl(candidates[i]);
    if (!u) continue;
    if (/\.webm(\?|$)/i.test(u)) continue;
    if (/www-static|\.js(\?|$)/i.test(u)) continue;
    return u;
  }
  return "";
}

function pickTitleFromCard(cardHtml) {
  let m = cardHtml.match(/\btitle="([^"]{2,})"/i);
  if (m && m[1].indexOf("http") < 0) return getText(m[1]);
  m = cardHtml.match(/\balt="([^"]{2,})"/i);
  if (m) return getText(m[1]);
  return "";
}

function pickDurationFromCard(cardHtml) {
  const m = cardHtml.match(/class="[^"]*duration[^"]*"[^>]*>([^<]+)/i);
  return m ? getText(m[1]) : "";
}

function parseVideoList(html) {
  const results = [];
  const seen = {};
  const parts = String(html).split(/<li(?=[^>]*\bpcVideoListItem\b)/i);

  for (let i = 1; i < parts.length; i++) {
    const card = "<li" + parts[i].split(/<\/li>/i)[0] + "</li>";

    let viewkey = "";
    let m = card.match(/data-video-vkey="([a-zA-Z0-9]+)"/i);
    if (m) viewkey = m[1];
    if (!viewkey) viewkey = extractViewkey(card);
    if (!viewkey || seen[viewkey]) continue;
    seen[viewkey] = true;

    const title = pickTitleFromCard(card) || viewkey;
    const cover = pickCoverFromCard(card);
    const durationText = pickDurationFromCard(card);

    results.push({
      id: viewkey,
      type: "url",
      title: title,
      coverUrl: cover,
      posterPath: cover,
      backdropPath: cover,
      durationText: durationText,
      description: durationText ? "时长 " + durationText : "",
      link: viewkey,
      mediaType: "movie"
    });
  }
  return results;
}

async function loadHot(params = {}) {
  const page = Number(params.page || 1);
  return parseVideoList(await fetchHtml(BASE_URL + "/video?o=ht&page=" + page));
}

async function loadNewest(params = {}) {
  const page = Number(params.page || 1);
  return parseVideoList(await fetchHtml(BASE_URL + "/video?o=mr&page=" + page));
}

async function loadMostViewed(params = {}) {
  const page = Number(params.page || 1);
  return parseVideoList(await fetchHtml(BASE_URL + "/video?o=mv&page=" + page));
}

async function loadTopRated(params = {}) {
  const page = Number(params.page || 1);
  return parseVideoList(await fetchHtml(BASE_URL + "/video?o=tr&page=" + page));
}

async function loadCategory(params = {}) {
  const page = Number(params.page || 1);
  const cat = String(params.category || "111");
  let url;
  if (cat.indexOf("path:") === 0) {
    const path = cat.slice(5);
    url = BASE_URL + path + (path.indexOf("?") >= 0 ? "&" : "?") + "page=" + page;
  } else {
    url = BASE_URL + "/video?c=" + encodeURIComponent(cat) + "&page=" + page;
  }
  return parseVideoList(await fetchHtml(url));
}

async function search(params = {}) {
  const keyword = getText(params.keyword);
  const page = Number(params.page || 1);
  const sort = params.sort || "";
  if (!keyword) return loadHot({ page: page });
  let url = BASE_URL + "/video/search?search=" + encodeURIComponent(keyword) + "&page=" + page;
  if (sort) url += "&o=" + sort;
  return parseVideoList(await fetchHtml(url));
}

function parseFlashvars(html) {
  const m = html.match(/var\s+flashvars_\d+\s*=\s*(\{[\s\S]*?\});/);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch (e) {
    return null;
  }
}

function buildSourcesFromFlashvars(flashvars) {
  const sources = [];
  const defs = (flashvars && flashvars.mediaDefinitions) || [];
  for (let i = 0; i < defs.length; i++) {
    const def = defs[i];
    if (!def || !def.videoUrl) continue;
    const format = String(def.format || "").toLowerCase();
    const url = def.videoUrl;
    if (format !== "hls" && url.indexOf(".m3u8") < 0) continue;
    let quality = def.quality;
    if (Array.isArray(quality)) {
      quality = Math.max.apply(null, quality.map(Number)) || 0;
    } else {
      quality = parseInt(quality, 10) || 0;
    }
    sources.push({ quality: quality, url: url });
  }
  sources.sort(function (a, b) {
    return (b.quality || 0) - (a.quality || 0);
  });
  return sources;
}

async function loadDetail(link) {
  const viewkey = getText(link);
  if (!viewkey) return null;

  const pageUrl = BASE_URL + "/view_video.php?viewkey=" + encodeURIComponent(viewkey);
  const html = await fetchHtml(pageUrl);
  const flashvars = parseFlashvars(html);
  if (!flashvars) {
    return {
      id: viewkey,
      type: "url",
      title: viewkey,
      description: "未能解析播放数据",
      link: viewkey,
      mediaType: "movie"
    };
  }

  const sources = buildSourcesFromFlashvars(flashvars);
  const best = sources[0];
  let cover = absUrl(flashvars.image_url || "");

  const $ = Widget.html.load(html);
  const pageTitle = getText(
    flashvars.video_title ||
      $("h1.title").text() ||
      $("meta[property='og:title']").attr("content")
  );

  const duration = parseInt(flashvars.video_duration || 0, 10) || 0;
  const durationText = duration
    ? Math.floor(duration / 60) + ":" + String(duration % 60).padStart(2, "0")
    : "";

  return {
    id: viewkey,
    type: "url",
    title: pageTitle || viewkey,
    description: durationText ? "时长 " + durationText : "",
    coverUrl: cover,
    posterPath: cover,
    backdropPath: cover,
    duration: duration,
    durationText: durationText,
    videoUrl: best ? best.url : "",
    mediaType: "movie",
    link: viewkey,
    customHeaders: {
      "User-Agent": UA,
      "Referer": pageUrl,
      "Origin": "https://www.pornhub.com"
    }
  };
}

async function loadResource(params = {}) {
  const viewkey = getText(params.link || params.id || "");
  if (!viewkey) return [];

  const pageUrl = BASE_URL + "/view_video.php?viewkey=" + encodeURIComponent(viewkey);
  const html = await fetchHtml(pageUrl);
  const flashvars = parseFlashvars(html);
  if (!flashvars) return [];

  const sources = buildSourcesFromFlashvars(flashvars);
  const headers = {
    "User-Agent": UA,
    "Referer": pageUrl,
    "Origin": "https://www.pornhub.com"
  };

  return sources.map(function (s) {
    return {
      name: (s.quality || "未知") + "p",
      description: "HLS " + (s.quality || "") + "p",
      url: s.url,
      customHeaders: headers
    };
  });
}
