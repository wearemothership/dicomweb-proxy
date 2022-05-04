(window.webpackJsonp=window.webpackJsonp||[]).push([[7],{1031:function(e,t,r){"use strict";r.r(t);var n=r(0),a=r.n(n),o=r(1),i=r.n(o),s=r(147),c=r(45),u=r(1055),l=r(1058),f=r(82),d=function(){return new URLSearchParams(Object(f.f)().search)},p=s.a.urlUtil,v=function(e,t){var r=p.queryString.getQueryFilters(t),n=r&&r.seriesInstanceUID,a=e||n;return p.paramString.parseParam(a)};function h(e){var t=e.match,r=e.location,n=t.params,o=n.project,i=n.location,s=n.dataset,f=n.dicomStore,h=n.studyInstanceUIDs,g=n.seriesInstanceUIDs,y=d().get("token");y&&(c.a.getAccessToken=function(){return y});var m=Object(l.a)({project:o,location:i,dataset:s,dicomStore:f}),b=p.paramString.parseParam(h),S=v(g,r);return m&&b?a.a.createElement(u.a,{studyInstanceUIDs:b,seriesInstanceUIDs:S}):null}h.propTypes={match:i.a.shape({params:i.a.shape({studyInstanceUIDs:i.a.string.isRequired,seriesInstanceUIDs:i.a.string,dataset:i.a.string,dicomStore:i.a.string,location:i.a.string,project:i.a.string})}),location:i.a.any};t.default=h},1051:function(e,t,r){"use strict";r.d(t,"a",(function(){return a}));var n=r(0);function a(e){var t=Object(n.useRef)();return Object(n.useEffect)((function(){t.current=e}),[e]),t.current}},1052:function(e,t,r){"use strict";function n(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function a(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?n(r,!0).forEach((function(t){o(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):n(r).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function o(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function i(e,t,r,n,a,o,i){try{var s=e[o](i),c=s.value}catch(e){return void r(e)}s.done?t(c):Promise.resolve(c).then(n,a)}function s(e){return function(){var t=this,r=arguments;return new Promise((function(n,a){var o=e.apply(t,r);function s(e){i(o,n,a,s,c,"next",e)}function c(e){i(o,n,a,s,c,"throw",e)}s(void 0)}))}}function c(e,t){for(var r=0;r<t.length;r++){var n=t[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}var u=function(){function e(){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e)}var t,r,n,o,i,u,l,f;return t=e,(r=[{key:"setAccessToken",value:function(e){e||console.error("Access token is empty"),this.accessToken=e}},{key:"getUrlBaseDicomWeb",value:function(e,t,r,n){return this.urlBase+"/projects/".concat(e,"/locations/").concat(t,"/datasets/").concat(r,"/dicomStores/").concat(n,"/dicomWeb")}},{key:"getUrlPath",value:function(e,t,r,n){"/projects/".concat(e,"/locations/").concat(t,"/datasets/").concat(r,"/dicomStores/").concat(n)}},{key:"doRequest",value:(f=s(regeneratorRuntime.mark((function e(t){var r,n,o,i,s,c,u,l=arguments;return regeneratorRuntime.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return r=l.length>1&&void 0!==l[1]?l[1]:{},n=l.length>2&&void 0!==l[2]?l[2]:{},o=new URL(t),i=null,o.search=new URLSearchParams(n),e.prev=5,e.next=8,fetch(o,a({},this.fetchConfig,{config:r}));case 8:return s=e.sent,e.prev=9,e.next=12,s.json();case 12:i=e.sent,e.next=17;break;case 15:e.prev=15,e.t0=e.catch(9);case 17:if(!(s.status>=200&&s.status<300&&null!=i)){e.next=27;break}if(null==i.nextPageToken){e.next=24;break}return n.pageToken=i.nextPageToken,e.next=22,this.doRequest(t,r,n);case 22:for(u in c=e.sent,i)i.hasOwnProperty(u)&&(i[u]=i[u].concat(c.data[u]));case 24:return e.abrupt("return",{isError:!1,status:s.status,data:i});case 27:return e.abrupt("return",{isError:!0,status:s.status,message:i&&i.error&&i.error.message||"Unknown error"});case 28:e.next=35;break;case 30:if(e.prev=30,e.t1=e.catch(5),!i||!i.error){e.next=34;break}return e.abrupt("return",{isError:!0,status:e.t1.status,message:e.t1.response.data.error.message||"Unspecified error"});case 34:return e.abrupt("return",{isError:!0,message:e.t1&&e.t1.message||"Oops! Something went wrong"});case 35:case"end":return e.stop()}}),e,this,[[5,30],[9,15]])}))),function(e){return f.apply(this,arguments)})},{key:"loadProjects",value:(l=s(regeneratorRuntime.mark((function e(){return regeneratorRuntime.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.abrupt("return",this.doRequest("https://cloudresourcemanager.googleapis.com/v1/projects"));case 1:case"end":return e.stop()}}),e,this)}))),function(){return l.apply(this,arguments)})},{key:"loadLocations",value:(u=s(regeneratorRuntime.mark((function e(t){return regeneratorRuntime.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.abrupt("return",this.doRequest("".concat(this.urlBaseProject,"/").concat(t,"/locations")));case 1:case"end":return e.stop()}}),e,this)}))),function(e){return u.apply(this,arguments)})},{key:"loadDatasets",value:(i=s(regeneratorRuntime.mark((function e(t,r){return regeneratorRuntime.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.abrupt("return",this.doRequest("".concat(this.urlBaseProject,"/").concat(t,"/locations/").concat(r,"/datasets")));case 1:case"end":return e.stop()}}),e,this)}))),function(e,t){return i.apply(this,arguments)})},{key:"loadDicomStores",value:(o=s(regeneratorRuntime.mark((function e(t){return regeneratorRuntime.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.abrupt("return",this.doRequest("".concat(this.urlBase,"/").concat(t,"/dicomStores")));case 1:case"end":return e.stop()}}),e,this)}))),function(e){return o.apply(this,arguments)})},{key:"fetchConfig",get:function(){if(!this.accessToken)throw new Error("OIDC access_token is not set");return{method:"GET",headers:{Authorization:"Bearer "+this.accessToken}}}},{key:"urlBase",get:function(){return this.healthcareApiEndpoint||"https://healthcare.googleapis.com/v1beta1"},set:function(e){this.healthcareApiEndpoint=e}},{key:"urlBaseProject",get:function(){return this.urlBase+"/projects"}}])&&c(t.prototype,r),n&&c(t,n),e}();t.a=new u},1053:function(e,t,r){var n=r(662);e.exports=function(e,t){return n(t,(function(t){return e[t]}))}},1055:function(e,t,r){"use strict";var n=r(63),a=r(0),o=r.n(a),i=r(95),s=r(179),c=r(147),u=r(9),l=r(1051),f=r(1054),d=r(1),p=r.n(d),v=r(272),h=r(14),g=r(83),y=r(274);function m(e,t,r,n,a,o,i){try{var s=e[o](i),c=s.value}catch(e){return void r(e)}s.done?t(c):Promise.resolve(c).then(n,a)}function b(e){return function(){var t=this,r=arguments;return new Promise((function(n,a){var o=e.apply(t,r);function i(e){m(o,n,a,i,s,"next",e)}function s(e){m(o,n,a,i,s,"throw",e)}i(void 0)}))}}function S(e,t){return function(e){if(Array.isArray(e))return e}(e)||function(e,t){if(!(Symbol.iterator in Object(e)||"[object Arguments]"===Object.prototype.toString.call(e)))return;var r=[],n=!0,a=!1,o=void 0;try{for(var i,s=e[Symbol.iterator]();!(n=(i=s.next()).done)&&(r.push(i.value),!t||r.length!==t);n=!0);}catch(e){a=!0,o=e}finally{try{n||null==s.return||s.return()}finally{if(a)throw o}}return r}(e,t)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance")}()}function w(e){return function(e){if(Array.isArray(e)){for(var t=0,r=new Array(e.length);t<e.length;t++)r[t]=e[t];return r}}(e)||function(e){if(Symbol.iterator in Object(e)||"[object Arguments]"===Object.prototype.toString.call(e))return Array.from(e)}(e)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance")}()}var I=i.a.OHIFStudyMetadata,D=i.a.OHIFSeriesMetadata,j=s.a.retrieveStudiesMetadata,O=s.a.deleteStudyMetadataPromise,k=c.a.studyMetadataManager,R=c.a.makeCancelable,U=function(e,t,r,n){var a=!1;return n||(a=x(e,t,r)),a},x=function(e,t,r){var n,a,o,i,s,c,u,l=!1;if(Object.keys(r).length>0){var f=r.seriesInstanceUID,d=(n=t.getDisplaySets(),a=f,o=function(e,t){return t.SeriesInstanceUID===e},i=w(n),s=[],c=0,(u=a.split(",")).forEach((function(e){var t=i.findIndex(o.bind(void 0,e));if(t>=0){var r=S(i.splice(t,1),1)[0];s[c]=r,c++}})),{promoted:c===u.length,data:[].concat(s,w(i))});e.displaySets=d.data,l=d.promoted}return l},P=function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},r=arguments.length>2?arguments[2]:void 0,n=t.seriesInstanceUID,a=!0;if(!n)return a;var o=n.split(","),i=function(){if(d.length===o.length)return d.every((function(e){return o.some((function(t){return t===e.SeriesInstanceUID}))}))},s=function(){for(var e=!0,t=0;t<o.length;t++){var r=o[t],n=d[t];if(!n||n.SeriesInstanceUID!==r){e=!1;break}}return e},c=e.series,u=void 0===c?[]:c,l=e.displaySets,f=void 0===l?[]:l,d=r?u:f,p=r?i:s;return a=!!d&&p()},E=function(e,t){var r=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{};if(!e){var n=r.show,a=void 0===n?function(){}:n;a({message:t})}},A=function(e,t){var r=v.c.modules.sopClassHandlerModule,n=e.getData(),a=new D(t,n);e.getSeriesByUID(t.SeriesInstanceUID)?e.updateSeries(t.SeriesInstanceUID,a):e.addSeries(a),e.createAndAddDisplaySetsForSeries(r,a),n.displaySets=e.getDisplaySets(),n.derivedDisplaySets=e.getDerivedDatasets({Modality:t.Modality}),C(n,e)},C=function(e,t){var r=e.StudyInstanceUID;k.get(r)||k.add(t)},q=function(e,t){var r=v.c.modules.sopClassHandlerModule;e.displaySets||(e.displaySets=t.createDisplaySets(r)),e.derivedDisplaySets&&t._addDerivedDisplaySets(e.derivedDisplaySets)},T=function(e){return{StudyInstanceUID:e.StudyInstanceUID,series:e.series.map((function(e){return{SeriesInstanceUID:e.SeriesInstanceUID}}))}};function B(e){var t,r,n=e.server,i=e.studyInstanceUIDs,s=e.seriesInstanceUIDs,c=e.clearViewportSpecificData,d=e.setStudyData,p=S(Object(a.useState)(!1),2),v=p[0],m=p[1],D=S(Object(a.useState)([]),2),x=D[0],B=D[1],M=S(Object(a.useState)(!1),2),F=M[0],L=M[1],G=Object(h.R)(),V=Object(a.useContext)(g.c).appConfig,H=void 0===V?{}:V,N=H.filterQueryParam,Q=void 0!==N&&N,W=H.maxConcurrentMetadataRequests,_=function(e,r){if(Array.isArray(e)&&e.length>0){var n=e.map((function(e){d(e.StudyInstanceUID,T(e));var n=new I(e,e.StudyInstanceUID);return q(e,n),C(e,n),t[e.StudyInstanceUID]=R(z(n)).then((function(t){t&&!t.isCanceled&&function(e,t,r){U(e,t,r,Q)&&c(0);var n=P(e,r,Q);E(n,"Query parameters were not totally applied. It might be using original series list for given study.",G),B([].concat(w(x),[e]))}(e,n,r)})).catch((function(e){e&&!e.isCanceled&&(m(e),u.a.error(e))})).finally((function(){L(!0)})),e}));B(n)}},z=function(){var e=b(regeneratorRuntime.mark((function e(t){var r,n,a,o,i,s;return regeneratorRuntime.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if(r=t.getData(),n=r.seriesLoader){e.next=3;break}return e.abrupt("return");case 3:return a=function(){var e=b(regeneratorRuntime.mark((function e(){var r;return regeneratorRuntime.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if(n.hasNext()){e.next=2;break}return e.abrupt("return");case 2:return e.next=4,n.next();case 4:return r=e.sent,A(t,r),B((function(e){return w(e)})),e.abrupt("return",a());case 8:case"end":return e.stop()}}),e)})));return function(){return e.apply(this,arguments)}}(),o=W||t.getSeriesCount(),i=Array(o).fill(null).map(a),e.next=8,Promise.all(i);case 8:return s=e.sent,L(!0),e.abrupt("return",s);case 11:case"end":return e.stop()}}),e)})));return function(t){return e.apply(this,arguments)}}(),J=function(){var e=b(regeneratorRuntime.mark((function e(){var t,a,o;return regeneratorRuntime.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:try{t={},a=s&&s[0],o=[n,i],a&&(t.seriesInstanceUID=a,Q&&o.push(t)),(H.splitQueryParameterCalls||H.enableGoogleCloudAdapter)&&o.push(!0),r[i]=R(j.apply(void 0,o)).then((function(e){e&&!e.isCanceled&&_(e,t)})).catch((function(e){e&&!e.isCanceled&&(m(e),u.a.error(e))}))}catch(e){e&&(m(e),u.a.error(e))}case 1:case"end":return e.stop()}}),e)})));return function(){return e.apply(this,arguments)}}(),K=Object(a.useCallback)((function(){for(var e in r)"cancel"in r[e]&&r[e].cancel();for(var n in t)"cancel"in t[n]&&(t[n].cancel(),O(n),k.remove(n))})),X=Object(l.a)(i);if(Object(a.useEffect)((function(){!(X&&X.every((function(e){return i.includes(e)})))&&(k.purge(),K())}),[X,K,i]),Object(a.useEffect)((function(){return t={},r={},J(),function(){K()}}),[]),v){var Y=JSON.stringify(v);return Y.includes("404")||Y.includes("NOT_FOUND")?o.a.createElement(y.a,null):o.a.createElement(y.a,{message:"Failed to retrieve study data"})}return o.a.createElement(f.a,{studies:x,isStudyLoaded:F,studyInstanceUIDs:i})}B.propTypes={studyInstanceUIDs:p.a.array.isRequired,seriesInstanceUIDs:p.a.array,server:p.a.object,clearViewportSpecificData:p.a.func.isRequired,setStudyData:p.a.func.isRequired};var M=B,F=r(17).a.redux.actions,L=F.clearViewportSpecificData,G=F.setStudyData,V=function(e){return!0===e.active},H=Object(n.b)((function(e,t){var r=e.servers.servers.find(V);return{server:t.server||r}}),(function(e){return{setStudyData:function(t,r){e(G(t,r))},clearViewportSpecificData:function(){e(L())}}}))(M);t.a=H},1056:function(e,t,r){var n=r(1053),a=r(273);e.exports=function(e){return null==e?[]:n(e,a(e))}},1057:function(e,t,r){"use strict";r.d(t,"a",(function(){return n})),r.d(t,"c",(function(){return a})),r.d(t,"b",(function(){return o}));var n=function(e,t){var r=e.wadoUriRoot,n=e.qidoRoot,a=e.wadoRoot,o=e.dataset,i=void 0===o?"":o,s=e.dicomStore,c=void 0===s?"":s,u=e.location,l=void 0===u?"":u,f=e.project;return[{name:t,dataset:i,dicomStore:c,location:l,project:void 0===f?"":f,imageRendering:"wadors",thumbnailRendering:"wadors",type:"dicomWeb",active:!0,wadoUriRoot:r,qidoRoot:n,wadoRoot:a,supportsFuzzyMatching:!1,qidoSupportsIncludeField:!1}]},a=function(e){return e&&!!e.dataset&&!!e.dicomStore&&!!e.location&&!!e.project},o=function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},r=Object.keys(e).length,n=Object.keys(t).length;return!(!r||!n)&&(e.dataset===t.dataset&&e.dataset===t.dataset&&e.dicomStore===t.dicomStore&&e.location===t.location&&e.project===t.project)}},1058:function(e,t,r){"use strict";r.d(t,"a",(function(){return v}));var n=r(0),a=r(1052),o=r(1051),i=r(1057),s=r(63),c=(r(246),r(83)),u=function(e){return e&&e.servers&&e.servers.find((function(e){return!0===e.active}))},l=function(e,t,r,n,o){var s=[];if(e.enableGoogleCloudAdapter){a.a.urlBase=e.healthcareApiEndpoint;var c=a.a.getUrlBaseDicomWeb(t,r,n,o),u={project:t,location:r,dataset:n,dicomStore:o,wadoUriRoot:c,qidoRoot:c,wadoRoot:c};if(s=i.a(u,o),!f(s[0],e))return}return s},f=function(e,t){return t.enableGoogleCloudAdapter?i.c(e):!!e},d=function(e,t){e({type:"SET_SERVERS",servers:t})},p=function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:[],t=arguments.length>1?arguments[1]:void 0,r=arguments.length>2?arguments[2]:void 0,n=arguments.length>3?arguments[3]:void 0,a=arguments.length>4?arguments[4]:void 0;arguments.length>5&&arguments[5],arguments.length>6&&arguments[6],arguments.length>7&&arguments[7],arguments.length>8&&arguments[8];if(!a.enableGoogleCloudAdapter)return!1;var o=t!==e&&t;if(o)return!1;if(!n||!n.length)return!1;if(!e.length||!r)return!0;var s=n[0],c=e.some(i.b.bind(void 0,s));return!c};function v(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=e.project,r=e.location,a=e.dataset,i=e.dicomStore,v=Object(s.d)((function(e){return e&&e.servers})),h=Object(o.a)(v),g=Object(s.c)(),y=Object(n.useContext)(c.c).appConfig,m=void 0===y?{}:y,b=u(v),S=l(m,t,r,a,i)||[];if(p(v.servers,h,b,S,m,t,r,a,i))d(g,S);else if(f(b,m))return b}}}]);
//# sourceMappingURL=ViewerRouting.bundle.e7e4301b825b233e8505.js.map