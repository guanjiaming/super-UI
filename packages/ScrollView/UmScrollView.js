const template1 = document.createElement('template');
template1.innerHTML = `
  <style>
    .um-scroll-view {
      height: 100%;
      width: 100%;
      overflow-y: scroll!important;
      user-select: none;
    }
    .um-scroll-inner {
       position: relative;
    }
    .pulling-refresh {
      position: absolute;
      left: 0;
      width: 100%;
      overflow: hidden;
      font-size: 14px;
      text-align: center;
      -webkit-transform: translateY(-100%);
      transform: translateY(-100%);
    }
    .pulling-load {
      line-height: 1em;
    }
  </style>
  <div id="scrollView" class="um-scroll-view">
    <div id="scrollInner" class="um-scroll-inner">
      <div id="pullRefresh" class="pulling-refresh">下拉即可刷新</div>
        <slot></slot>
      <div class="pulling-load">下拉加载更多</div>
    </div>
  </div>
`;

class UmScrollView extends HTMLElement {
  constructor() {
    super();

    this._shadowRoot = this.attachShadow({mode: 'closed'});
    this._shadowRoot.appendChild(template1.content.cloneNode(true));

    this.$scrollView = this._shadowRoot.querySelector('#scrollView');
    this.$scrollInner = this._shadowRoot.querySelector('#scrollInner');
    this.$pullRefresh = this._shadowRoot.querySelector('#pullRefresh');
    this.$pullLoad = this._shadowRoot.querySelector('#pullLoad');

  }

  /**
   * 当自定义元素第一次被加入到文档时被调用。
   */
  connectedCallback() {
    this.render();
  }

  /**
   * 是否开启下拉刷新
   */
  get isUseRefresh() {
    let useRefresh = this.getAttribute('use-refresh');
    return useRefresh !== 'false';
  }

  /**
   * 触发下拉刷新的门槛
   */
  get refreshThreshold() {
    let threshold = this.getAttribute('refresh-threshold');
    if (threshold && parseInt(threshold) && typeof parseInt(threshold) !== 'number') {
      return parseInt(threshold)
    } else return 60;
  }

  /**
   * 是否开启下拉加载
   */
  get isUseLoad() {
    let useLoad = this.getAttribute('use-load');
    return useLoad !== 'false';
  }

  render() {
    console.log('render');
    console.log(this.refreshThreshold);
  }
}

window.customElements.define('um-scroll-view', UmScrollView);
