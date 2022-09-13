const template = document.createElement('template');
template.innerHTML = `
  <style>
    .um-button {
      position: relative;
      display: inline-block;
      height: 32px;
      padding: 4px 15px;
      font-weight: 400;
      white-space: nowrap;
      text-align: center;
      touch-action: manipulation;
      font-size: 14px;
      border-radius: 4px;
      cursor: pointer;
      color: rgba(0,0,0,.85);
      background: #fff;
      border: 1px solid #d9d9d9;
      box-sizing: border-box;
    }
    .um-button, .um-button:active, .um-button:focus {
      outline: 0;
    }
    .um-button--primary {
      color: #fff;
      background: #1890ff;
      border-color: #1890ff;
      text-shadow: 0 -1px 0 rgba(0,0,0,.12);
      -webkit-box-shadow: 0 2px 0 rgba(0,0,0,.045);
      box-shadow: 0 2px 0 rgba(0,0,0,.045);
    }
  </style>
  <button class="um-button">
    <span><slot>Button</slot></span>
  </button>
`;

class UmButton extends HTMLElement {
  constructor() {
    super();

    this._shadowRoot = this.attachShadow({mode: "closed"});
    // this._shadowRoot = this.attachShadow({mode: "open"});

    this._shadowRoot.appendChild(template.content.cloneNode(true));

    this.$button = this._shadowRoot.querySelector('button');

    this.$button.addEventListener('click', () => {
      this.dispatchEvent(
        new CustomEvent('onClick', {detail: "来自自定义元素的Hello"})
      )
    })
  }

  get type() {
    return this.getAttribute("type")
  }

  get size() {
    return this.getAttribute("size")
  }

  get disabled() {
    return this.getAttribute("disabled")
  }

  set disabled(value) {
    this.$button.setAttribute("disabled", value)
  }

  get loading() {
    return this.getAttribute("loading")
  }

  static get observedAttributed() {
    return ["type", "size"]
  }

  /**
   * 当自定义元素第一次被加入到文档时被调用。
   */
  connectedCallback() {
    this.render()
  }

  disconnectedCallback() {
  }

  adoptedCallback() {
  }

  attributeChangedCallback(name, oldValue, newValue) {

  }

  render() {

    /* 添加类名 */
    if (this.type) {
      this.$button.classList.add(`um-button--${this.type}`)
    }
    if (this.size) {
      this.$button.classList.add(`um-button--${this.size}`)
    }
    if (this.disabled === "" || this.disabled === "disabled" || this.disabled || this.loading) {
      this.$button.classList.add("is-disabled");
      this.$button.disabled = true;
    }
    if (this.loading) {
      this.$button.classList.add("is-loading");
    }

  }

}

window.customElements.define("um-button", UmButton);
