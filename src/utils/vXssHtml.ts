import * as xss from 'xss';
import type { Directive } from 'vue';

const bmXss = new xss.FilterXSS({
  onTag: (tag, html) => {
    return tag === 'a' ? html.replace(/<[^>]*>/g, '') : html;
  },
});

const vXssHtml: Directive = {
  mounted(el, binding) {
    el.innerHTML = bmXss.process(binding.value);
  },
  updated(el, binding) {
    el.innerHTML = bmXss.process(binding.value);
  },
};

export default vXssHtml;
