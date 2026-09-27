/**
 * 黄果 ForwardWidget v1.3
 * API: https://huangguoai.com
 * 封面解密: https://ai.wulii.de5.net
 */
WidgetMetadata = {
  id: "forward.huangguoai.tut",
  title: "黄果",
  version: "1.3.2",
  requiredVersion: "0.0.1",
  description: "黄果短剧：分类/搜索/分集播放；封面经 CF 解密代理显示",
  author: "宝宝巴士",
  site: "https://t.me/nostremby",
  detailCacheDuration: 180,
  globalParams: [
    {
      name: "apiBase",
      title: "API 地址",
      type: "input",
      value: "https://huangguoai.com"
    },
    {
      name: "coverProxy",
      title: "封面解密代理",
      type: "input",
      value: "https://ai.wulii.de5.net"
    },
    {
      name: "coverToken",
      title: "封面代理 Token",
      type: "input",
      value: "hg8f3a2c91b7e04d6a"
    }
  ],
  modules: [
    {
      id: "loadList",
      title: "分类",
      functionName: "loadList",
      cacheDuration: 300,
      params: [
        { name: "page", title: "页码", type: "page" },
        {
          name: "tid",
          title: "分类",
          type: "enumeration",
          value: "hot",
          enumOptions: [
            { title: "热门", value: "hot" },
            { title: "最新", value: "new" },
            { title: "排行榜", value: "rank" },
            { title: "AI成人短剧", value: "ai-duanju" },
            { title: "AI成人漫剧", value: "ai-manju" },
            { title: "AI换脸", value: "ai-huanlian" },
            { title: "AI魔改", value: "ai-mogai" },
            { title: "都市", value: "tag:dushi" },
            { title: "现代", value: "tag:xiandai" },
            { title: "校园", value: "tag:xiaoyuan" },
            { title: "熟女", value: "tag:shunv" },
            { title: "豪门", value: "tag:haomen" },
            { title: "后宫", value: "tag:hougong" },
            { title: "古风", value: "tag:gufeng" },
            { title: "奇幻", value: "tag:qihuan" },
            { title: "职场", value: "tag:zhichang" },
            { title: "娱乐圈", value: "tag:yulequan" },
            { title: "甜宠", value: "tag:tianchong" },
            { title: "年下", value: "tag:nianxia" }
          ]
        }
      ]
    },
    {
      id: "loadResource",
      title: "播放资源",
      functionName: "loadResource",
      type: "stream",
      cacheDuration: 0,
      params: []
    }
  ],
  search: {
    title: "搜索",
    functionName: "search",
    params: [
      { name: "keyword", title: "关键词", type: "input" },
      { name: "page", title: "页码", type: "page" }
    ]
  }
};

function t(v) {
  return String(v == null ? "" : v).trim();
}
function cfg(params) {
  params = params || {};
  return {
    apiBase: t(params.apiBase || "https://huangguoai.com").replace(/\/+$/, ""),
    coverProxy: t(params.coverProxy || "https://ai.wulii.de5.net").replace(/\/+$/, ""),
    coverToken: t(params.coverToken || "hg8f3a2c91b7e04d6a")
  };
}
function qs(obj) {
  var parts = [];
  Object.keys(obj || {}).forEach(function (k) {
    if (obj[k] == null || obj[k] === "") return;
    parts.push(encodeURIComponent(k) + "=" + encodeURIComponent(String(obj[k])));
  });
  return parts.length ? "?" + parts.join("&") : "";
}
async function httpJson(url) {
  var res = await Widget.http.get(url, {
    headers: {
      Accept: "application/json, text/plain, */*",
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
      Referer: "https://huangguoai.com/"
    }
  });
  var d = res && res.data;
  if (typeof d === "string") {
    try { d = JSON.parse(d); } catch (e) {}
  }
  return d;
}
function absCover(base, cover) {
  cover = t(cover);
  if (!cover) return "";
  if (/^https?:\/\//i.test(cover)) return cover;
  if (cover.indexOf("//") === 0) return "https:" + cover;
  return base + (cover[0] === "/" ? "" : "/") + cover;
}
/** 加密封面 → CF 解密代理 */
function proxiedCover(c, encUrl) {
  encUrl = t(encUrl);
  if (!encUrl) return "";
  if (!c.coverProxy) return encUrl;
  var q = { url: encUrl };
  if (c.coverToken) q.token = c.coverToken;
  return c.coverProxy + qs(q);
}
function toItem(c, it) {
  if (!it) return null;
  var id = t(it.id != null ? it.id : it.vod_id);
  if (!id) return null;
  var title = t(it.title || it.vod_name || it.name);
  var enc = absCover(c.apiBase, it.cover || it.vod_pic || it.pic || "");
  var cover = proxiedCover(c, enc);
  var ep = it.episode_count || it.total_episodes || "";
  var remark = "";
  if (it.is_finished) remark = "全" + (ep || "") + "集";
  else if (ep) remark = "更新至" + ep + "集";
  return {
    id: "hgai:" + id,
    type: "url",
    title: title || id,
    coverUrl: cover,
    posterPath: cover,
    backdropPath: cover,
    description: remark,
    mediaType: "tv",
    link: "hgai:" + id
  };
}

async function fetchList(c, tid, page) {
  page = Number(page || 1) || 1;
  tid = t(tid) || "hot";
  var data, items = [];
  if (tid === "rank" || tid === "ranks") {
    try {
      data = await httpJson(c.apiBase + "/api/ranks/hot" + qs({ page: page }));
      items = (data && data.data && data.data.items) || [];
    } catch (e) {}
  }
  if (!items.length && String(tid).indexOf("tag:") === 0) {
    data = await httpJson(c.apiBase + "/api/videos" + qs({ page: page, page_size: 24, sort: "hot", tag: tid.slice(4) }));
    items = (data && data.data && data.data.items) || [];
  }
  // AI 换脸 / 魔改：官方分类参数无效，用搜索接口
  if (!items.length && (tid === "ai-huanlian" || tid === "ai-mogai")) {
    var kw = tid === "ai-huanlian" ? "AI换脸" : "AI魔改";
    data = await httpJson(c.apiBase + "/api/search" + qs({ q: kw, page: page }));
    items = (data && data.data && data.data.items) || (data && data.data && data.data.list) || [];
  }
  if (!items.length && (tid === "ai-duanju" || tid === "ai-manju")) {
    var kw2 = tid === "ai-duanju" ? "短剧" : "漫剧";
    // 频道页无可靠 filter 时先热门，再标题兜底
    data = await httpJson(c.apiBase + "/api/videos" + qs({ page: page, page_size: 24, sort: "hot" }));
    items = (data && data.data && data.data.items) || [];
  }
  if (!items.length) {
    var sort = tid === "new" ? "new" : "hot";
    data = await httpJson(c.apiBase + "/api/videos" + qs({ page: page, page_size: 24, sort: sort }));
    items = (data && data.data && data.data.items) || [];
  }
  var out = [];
  for (var i = 0; i < items.length; i++) {
    var item = toItem(c, items[i]);
    if (item) out.push(item);
  }
  return out;
}

async function loadList(params) {
  params = params || {};
  return await fetchList(cfg(params), t(params.tid) || "hot", Number(params.page || 1) || 1);
}

async function search(params) {
  params = params || {};
  var c = cfg(params);
  var kw = t(params.keyword);
  if (!kw) return [];
  var page = Number(params.page || 1) || 1;
  try {
    var data = await httpJson(c.apiBase + "/api/search" + qs({ q: kw, page: page }));
    var items = (data && data.data && data.data.items) || (data && data.data && data.data.list) || [];
    if (items.length) {
      var out = [];
      for (var i = 0; i < items.length; i++) {
        var item = toItem(c, items[i]);
        if (item) out.push(item);
      }
      return out;
    }
  } catch (e) {}
  var all = await fetchList(c, "hot", page);
  return all.filter(function (x) { return String(x.title || "").indexOf(kw) >= 0; });
}

function parseLink(link) {
  var s = t(link).replace(/^huangguoai:/, "hgai:");
  if (s.indexOf("hgai:") === 0) s = s.slice(5);
  var parts = s.split(":");
  return { id: t(parts[0]), ep: t(parts[1] || "") };
}

async function loadDetail(link) {
  var p = parseLink(link);
  if (!p.id) return null;
  var c = cfg({});
  var data = await httpJson(c.apiBase + "/api/videos/" + encodeURIComponent(p.id));
  var d = (data && data.data) || {};
  var enc = absCover(c.apiBase, d.cover || "");
  var cover = proxiedCover(c, enc);
  var eps = Array.isArray(d.episodes) ? d.episodes : [];
  var episodeItems = [];
  if (eps.length) {
    for (var i = 0; i < eps.length; i++) {
      var ep = eps[i];
      var n = ep.ep_num || ep.episode || (i + 1);
      var epLink = "hgai:" + p.id + ":" + n;
      episodeItems.push({
        id: epLink, type: "url",
        title: t(ep.title || ("第" + n + "集")),
        mediaType: "tv", seasonNumber: 1, episodeNumber: Number(n) || (i + 1),
        link: epLink, videoUrl: "", playerType: "app"
      });
    }
  } else {
    episodeItems.push({
      id: "hgai:" + p.id + ":1", type: "url", title: "第1集",
      mediaType: "tv", seasonNumber: 1, episodeNumber: 1,
      link: "hgai:" + p.id + ":1", videoUrl: "", playerType: "app"
    });
  }
  return {
    id: "hgai:" + p.id, type: "url",
    title: t(d.title || p.id),
    coverUrl: cover, posterPath: cover, backdropPath: cover,
    description: t(d.description || ""),
    mediaType: "tv", link: "hgai:" + p.id,
    episodeItems: episodeItems
  };
}

async function loadResource(params) {
  params = params || {};
  var c = cfg(params);
  var p = parseLink(t(params.link || params.id || ""));
  if (!p.id) return [];
  var ep = p.ep || t(params.episode) || "1";
  var data = await httpJson(c.apiBase + "/api/videos/" + encodeURIComponent(p.id) + "/play" + qs({ ep: ep }));
  var url = t((data && data.data && data.data.video_url) || (data && data.video_url) || "");
  if (!url) return [];
  return [{
    name: "黄果",
    description: "第" + ep + "集",
    url: url,
    playerType: "app",
    customHeaders: {
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
      Referer: "https://huangguoai.com/",
      "X-Forward-Skip-Redirect-Probe": "1"
    }
  }];
}
