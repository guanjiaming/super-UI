const requestAnimationFrame = (function () {
  {
    return (
      window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      function (callback) {
        return window.setTimeout(callback, callback.interval);
      }
    );
  }
})();

const cancelAnimationFrame = (function () {
  return (
    window.cancelAnimationFrame ||
    window.webkitCancelAnimationFrame ||
    function (id) {
      window.clearTimeout(id);
    }
  );
})();

function getNow() {
  return window.performance &&
  window.performance.now &&
  window.performance.timing
    ? window.performance.now() + window.performance.timing.navigationStart
    : +new Date();
}

class UmScrollView {
  constructor(
    el,
    options = {
      pullDownRefresh: {},
      pullUpLoad: {}
    }
  ) {
    this.$scrollView = document.querySelector(el);
    this.$scrollInner = this.$scrollView.children[0];

    this.isUseRefresh = options.isUseRefresh || true;
    this.isUseLoad = options.isUseLoad || true;

    this.pullDownRefresh = {
      fontSize: options.pullDownRefresh.fontSize || 14,
      color: options.pullDownRefresh.color || 14,
      threshold: options.pullDownRefresh.threshold || 60,
      stop: options.pullDownRefresh.stop || 42,
      defaultText: options.pullDownRefresh.defaultText || '下拉刷新',
      tipText: options.pullDownRefresh.tipText || '松开刷新',
      loadingText: options.pullDownRefresh.loadingText || '正在刷新中...',
      finishText: options.pullDownRefresh.finishText || '刷新完成'
    };

    this.pullUpLoad = {
      threshold: options.pullUpLoad.threshold || 60,
      defaultText: options.pullUpLoad.defaultText || '上拉加载更多',
      tipText: options.pullUpLoad.tipText || '上拉加载更多',
      loadingText: options.pullUpLoad.loadingText || '正在加载中...',
      finishText: options.pullUpLoad.finishText || '没有更多了'
    };

    this.touchClientYStart = null;
    this.touchClientYEnd = null;
    this.moveY = null;
    this.scrollTopY = null;
    this.c = 6.5;
    this.isFinishRefresh = true;
    this.isFinishLoadMore = true;
    this.timerId = null;

    // 2个容器的高度
    this.scrollViewHeight = this.$scrollView.offsetHeight;
    this.scrollInnerHeight = this.$scrollInner.offsetHeight;

    this.events = {};
    this.eventTypes = {
      scrollEnd: 'scroll-end',
      scroll: 'scroll',
      refresh: 'refresh'
    };

    this.__init__();
  }

  __init__() {
    if (this.isUseRefresh) {
      this.addRefresh();
      this.addEventTouchStart();
      this.addEventTouchMove();
      this.addEventTouchEnd();
    }

    if (this.isUseLoad) {
      this.addLoad()
      this.addEventScroll()
    }
  }

  /**
   * 添加监听
   */
  addWatch() {
    this.addEventTouchStart();
    this.addEventTouchMove();
    this.addEventTouchEnd();
    this.addEventScroll();
  }

  /**
   * 添加下拉刷新的一些dom和样式
   */
  addRefresh() {
    this.pullDownDom = document.createElement('div');
    this.pullDownDom.className = 'pulling-refresh';
    this.pullDownDom.innerText = this.pullDownRefresh.defaultText;
    this.pullDownDom.style.lineHeight = this.pullDownRefresh.stop + 'px';
    this.$scrollInner.prepend(this.pullDownDom);
  }

  /**
   * 添加
   */
  addLoad() {
    this.pullLoadDom = document.createElement('div');
    this.pullLoadDom.className = 'pulling-load';
    this.pullLoadDom.innerText = this.pullUpLoad.defaultText;
    this.$scrollInner.append(this.pullLoadDom);
  }

  /**
   * 设置下拉刷新的文字
   * @param text
   */
  setPullingRefreshText(text) {
    this.pullDownDom.innerText = text;
  }

  addEventTouchStart(e) {
    let self = this;
    this.$scrollView.addEventListener('touchstart', function (e) {
      self.touchClientYStart = e.touches[0].clientY - this.offsetTop;
      self.scrollTopY = this.scrollTop;
    });
  }

  addEventTouchMove() {
    let self = this;

    this.$scrollView.addEventListener('touchmove', function (e) {
      if (!self.isFinishRefresh) return; // 判断上次刷新是否完成了
      self.touchClientYEnd = e.touches[0].clientY - this.offsetTop;
      // 向下滑动手势判断
      if (self.touchClientYEnd - self.touchClientYStart > 0) {
        // 下拉刷新临界点判断, 达到则进行下拉刷新模拟
        if (this.scrollTop <= 0) {
          if (e.cancelable) e.preventDefault();
          self.moveY = Math.floor(Math.floor(self.touchClientYEnd - self.touchClientYStart - self.scrollTopY) / self.c);
          self.$scrollInner.style.transform = 'translateY(' + self.moveY + 'px)';
          self.$scrollInner.style.transition = 'transform 0s';
          if (self.moveY >= self.pullDownRefresh.threshold) { // 振动
            if (navigator.vibrate) navigator.vibrate(200);
            else if (navigator.webkitVibrate) navigator.webkitVibrate(200);
            requestAnimationFrame(function (){
              self.setPullingRefreshText(self.pullDownRefresh.tipText);
            })
          }
        }
      }
    });
  }

  addEventTouchEnd() {
    let self = this;
    this.$scrollView.addEventListener('touchend', function (e) {
      if (!self.isFinishRefresh) return; // 判断上次刷新是否完成了
      // 判断下拉的距离是否触发了"下拉刷新"
      if (self.moveY < self.pullDownRefresh.threshold) {
        // 没有触发，重置各值
        self.touchClientYStart = 0;
        self.touchClientYEnd = 0;
        self.moveY = 0;
        self.scrollTopY = 0;
        self.$scrollInner.style.transform = '';
        self.$scrollInner.style.transition = 'transform 1s cubic-bezier(.35,.81,.26,1)';
      } else {

        // 触发下拉刷新
        self.isFinishRefresh = false;
        self.setPullingRefreshText(self.pullDownRefresh.loadingText);
        self.$scrollInner.style.transform = 'translateY(' + self.pullDownRefresh.stop + 'px)';
        self.$scrollInner.style.transition = 'transform 300ms ease-out';
        // 响应事件
        self.trigger(self.eventTypes.refresh);
      }
    });
  }

  addEventScroll() {
    let self = this;
    this.$scrollView.addEventListener('scroll', function (e) {
      if (self.timerId) return;
      self.timerId = setTimeout(function () {
        let scrollTop = self.$scrollView.scrollTop;
        // 触发scroll事件
        self.trigger(self.eventTypes.scroll, scrollTop);
        // 判断是否触底了
        if (self.isFinishLoadMore) {
          if (scrollTop + self.scrollViewHeight + self.pullUpLoad.threshold >= self.scrollInnerHeight) {
            self.trigger(self.eventTypes.scrollEnd);
            self.isFinishLoadMore = false;
          }
        }
        clearTimeout(self.timerId);
        self.timerId = null;
      }, 100);
    });
  }

  /**
   * 告诉scroll-view，已经准备好一次的下拉刷新了
   */
  finishPullingRefresh() {
    this.setPullingRefreshText(this.pullDownRefresh.finishText);
    let self = this;
    setTimeout(function () {
      self.isFinishRefresh = true;
      self.touchClientYStart = 0;
      self.touchClientYEnd = 0;
      self.moveY = 0;
      self.scrollTopY = 0;
      self.$scrollInner.style.transform = '';
      self.$scrollInner.style.transition = 'transform 600ms cubic-bezier(.35,.81,.26,1)';
    }, 750);
  }

  /**
   * 告诉scroll-view，已经准备好下一次的 触底事件了
   */
  finishPullingLoad() {
    this.isFinishLoadMore = true;
    this.refresh()
  }

  /**
   * 滚动到指定元素
   */
  scrollToElement(selector, time = 300) {
    let elementOffsetTop;
    let element;
    if (typeof selector === 'string') {
      element = document.querySelector(selector);
      if (!element) {
        console.error('未找到对应元素');
        return;
      }

       elementOffsetTop = element.offsetTop || 0;

      this.scrollTo(0, elementOffsetTop, time);
    }
  }

  /**
   * 滚动到指定位置
   */
  scrollTo(x = 0, y = 0, time = 0) {
    let currentPos = {x: 0, y: this.$scrollView.scrollTop};
    const beginPoint = {
      x: currentPos.x,
      y: currentPos.y
    };

    const endPoint = {x, y};

    const deltaX = Math.abs(endPoint.x - beginPoint.x);
    const deltaY = Math.abs(endPoint.y - beginPoint.y);

    if (deltaX < 1 && deltaY < 1) {
      time = 0;
    }

    // time is 0
    if (!time) {
      this.$scrollView.scrollTo(endPoint.x, endPoint.y);
      return;
    }

    this.animateMove(beginPoint, endPoint, time);

  }

  animateMove(startPoint, endPoint, duration) {
    let self = this;
    let startTime = getNow();
    const destTime = startTime + duration;

    const step = function () {
      let now = getNow();

      if (now >= destTime) {
        cancelAnimationFrame(self.timer2);
        self.$scrollView.scrollTo(0, endPoint.y);
        return;
      }

      now = (now - startTime) / duration;

      let easing = self.easingFn(now);

      const newPoint = {};
      Object.keys(endPoint).forEach((key) => {
        const startValue = startPoint[key];
        const endValue = endPoint[key];
        newPoint[key] = (endValue - startValue) * easing + startValue;
      });
      self.$scrollView.scrollTo(0, newPoint.y);

      self.timer2 = requestAnimationFrame(step);
    };

    cancelAnimationFrame(self.timer2);
    step();
  }

  refresh() {
    this.scrollInnerHeight = this.$scrollInner.offsetHeight;
  }

  /**
   * 发布订阅设计模式：事件监听on、事件派遣trigger
   */
  on(type, fn, context = this) {
    if (!this.events[type]) {
      this.events[type] = [];
    }

    this.events[type].push([fn, context]);
    return this;
  }

  trigger(type, ...args) {
    let events = this.events[type];
    if (!events) return;

    let ret;
    let eventsCopy = [...events];
    for (let i = 0; i < events.length; i++) {
      let event = events[i];
      let [fn, context] = event;
      if (fn) {
        ret = fn.apply(context, args);
        if (ret === true) {
          return ret;
        }
      }
    }
  }

  easingFn(t) {
    return 1 + --t * t * t * t * t;
  }
}
