import * as xss from 'xss';
import type { Directive } from 'vue';

const bmXss = new xss.FilterXSS();

const vXssHtml: Directive = {
  mounted(el, binding) {
    el.innerHTML = bmXss.process(binding.value);
  },
  updated(el, binding) {
    el.innerHTML = bmXss.process(binding.value);
  },
};

export default vXssHtml;
