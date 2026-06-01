const zh = {
  /* 导航 */
  nav: {
    home: "首页",
    posts: "文章",
    tags: "标签",
    about: "关于",
  },

  /* 首页 */
  home: {
    title: "探索精彩内容",
    subtitle: "发现技术文章、分享编程心得、记录成长历程",
  },

  /* 文章 */
  post: {
    loading: "加载文章中...",
    empty: "暂无文章",
    emptyDesc: "还没有发布任何文章，敬请期待精彩内容。",
    minutes: "分钟",
    loadingMore: "加载中...",
  },

  /* 404 */
  notFound: {
    title: "页面不存在",
    desc: "抱歉，你访问的页面不存在或已被移除。请检查链接是否正确，或返回首页浏览。",
    backHome: "返回首页",
    goBack: "返回上页",
  },

  /* 页脚 */
  footer: {
    nav: "导航",
    aboutGroup: "关于",
    aboutUs: "关于我们",
    contact: "联系方式",
    privacy: "隐私政策",
    terms: "服务条款",
    social: "社交",
    rss: "RSS 订阅",
    brand: "记录技术成长，分享编程心得。用文字连接思想，用代码改变世界。",
    copyright: "保留所有权利。",
    builtWith: "基于 React & Tailwind CSS 构建",
  },

  /* Header */
  header: {
    darkMode: "切换暗色模式",
    lightMode: "切换亮色模式",
    menu: "菜单",
    langSwitch: "切换到英文",
  },

  /* 通用 */
  common: {
    loading: "加载中...",
    close: "关闭",
    confirm: "确认",
    cancel: "取消",
    search: "搜索...",
    searchAria: "搜索",
    clearSearch: "清除搜索",
  },

  /* 分页 */
  pagination: {
    total: "共",
    items: "条，",
    page: "页",
    currentPage: "第",
    prev: "上一页",
    next: "下一页",
    jumpTo: "跳至",
    go: "页",
    ok: "确定",
  },

  /* 布局切换 */
  layout: {
    grid: "网格视图",
    list: "列表视图",
  },

  /* 标签 */
  tag: {
    remove: "删除标签",
  },

  /* 日期 */
  date: {
    full: "YYYY年M月D日 HH:mm",
    short: "M月D日 HH:mm",
    yearFull: "YYYY年M月D日",
    mini: "M月D日",
  },

  /* HTML meta */
  meta: {
    title: "MyBlog - 技术博客",
    description: "MyBlog - 技术文章分享与编程心得",
  },

  /* 未分类 */
  uncategorized: "未分类",
};

export default zh;
export type Locale = typeof zh;
