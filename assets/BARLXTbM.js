import{l as d,a5 as b,g as y,S,R as T}from"./mOu0XqRs.js";function g(e){return S()?(T(e),!0):!1}function f(e){return typeof e=="function"?e():y(e)}const w=typeof window<"u"&&typeof document<"u";typeof WorkerGlobalScope<"u"&&globalThis instanceof WorkerGlobalScope;const P=Object.prototype.toString,O=e=>P.call(e)==="[object Object]",p=()=>{};function h(e,n){function o(...t){return new Promise((i,r)=>{Promise.resolve(e(()=>n.apply(this,t),{fn:n,thisArg:this,args:t})).then(i).catch(r)})}return o}function j(e,n={}){let o,t,i=p;const r=u=>{clearTimeout(u),i(),i=p};return u=>{const a=f(e),s=f(n.maxWait);return o&&r(o),a<=0||s!==void 0&&s<=0?(t&&(r(t),t=null),Promise.resolve(u())):new Promise((l,m)=>{i=n.rejectOnCancel?m:l,s&&!t&&(t=setTimeout(()=>{o&&r(o),t=null,l(u())},s)),o=setTimeout(()=>{t&&r(t),t=null,l(u())},a)})}}function x(e){let n;function o(){return n||(n=e()),n}return o.reset=async()=>{const t=n;n=void 0,t&&await t},o}function D(e,n=200,o={}){return h(j(n,o),e)}function F(e,n,o={}){const{immediate:t=!0}=o,i=d(!1);let r=null;function c(){r&&(clearTimeout(r),r=null)}function u(){i.value=!1,c()}function a(...s){c(),i.value=!0,r=setTimeout(()=>{i.value=!1,r=null,e(...s)},f(n))}return t&&(i.value=!0,w&&a()),g(u),{isPending:b(i),start:a,stop:u}}export{F as a,g as b,x as c,O as d,w as i,p as n,f as t,D as u};
