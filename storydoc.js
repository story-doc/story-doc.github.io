(function() {
var Storydoc = window.Storydoc = {
  mode: 'storyboard',

  insertHTML: function(html, selectors, position) {
    if (!selectors) return;
    const tags = typeof selectors === 'string' ? document.querySelectorAll(selectors) : [selectors];
    if (!tags) return;
    for (let i=0; i<tags.length; i++) {
      tags[i].insertAdjacentHTML(position||'afterbegin', html);
    }
  },

  createUrlParameterMap: function() {
    const params = {};
    if (!window.location.search) return params;
    const query = window.location.search.substring(1,window.location.search.length);

    const queryParams = query.split("&");
    const buf = [];
    for (let i=0, len=queryParams.length; i < len; i++) {
      const c = queryParams[i].split("=");
      const key = c.length > 0 ? decodeURIComponent(c[0]) : null;
      if (!key) continue;
      const value = c.length > 1 ? decodeURIComponent(c[1]) : null;
      params[key] = value;
    }
    return params;
  },

  populateParameterValues: function(text, params) {
    if (!text) return text;
    if (!params) return text.replace(/#\{[^\}]*\}/g, "");
    text = text.replace(/\\#\{/g, '=ESCAPE_START_TAG=');
    for (let key in params) {
      if (!params.hasOwnProperty(key)) continue;
      const value = params[key];
      text = text.replace(new RegExp('#{'+key.trim()+'}', 'g'), value);
    }
    text = text.replace(/#\{[^\}]*\}/g, ""); // remove undefined variables
    return text.replace(/=ESCAPE_START_TAG=/g, '#{');
  },

  initStep: function() {
    const metaTag = document.createElement('meta');
    const metaAttr = document.createAttribute('charset');
    metaAttr.value = 'UTF-8';
    metaTag.setAttributeNode(metaAttr); 
    document.getElementsByTagName('head')[0].appendChild(metaTag);

    this.removeTestTags();
    this.processParameterTags();
    const screenTag = document.getElementsByTagName('screen')[0];
    const actionTags = document.getElementsByTagName('action');
    const exceptionTags = document.getElementsByTagName('exception');
    const noteTags = document.getElementsByTagName('note');
    const baseTag = screenTag || actionTags[0] || exceptionTags[0] || noteTags[0] || document.getElementsByTagName('body')[0];

    this.renderScreenTitle(baseTag);
    this.renderScreen(screenTag);
    this.renderNotes(noteTags, baseTag);
    this.renderActions(actionTags, exceptionTags, baseTag);

    if (screenTag) screenTag.parentNode.removeChild(screenTag); // screen tag will be used to show no-actions
  },

  removeTestTags: function() {
    const tags = document.getElementsByTagName('test');
    this.removeTags(tags);
  },

  processParameterTags: function() {
    const tags = document.getElementsByTagName('parameter');
    for (let i=0; i<tags.length; i++) {
      const tag = tags[i];
      const name = tag.getAttribute('name');
      if (this.params.hasOwnProperty(name) && this.params[name]) continue;
      this.params[name] = tag.innerHTML;
    }
    this.removeTags(tags);
  },

  renderScreenTitle: function(baseTag) {
    const id = this.params.storydoc_id ? '['+this.params.storydoc_id+'] ' : '';
    const content = this.params.hasOwnProperty('storydoc_name') ? this.params.storydoc_name||'' : '';
    if (baseTag) baseTag.insertAdjacentHTML((baseTag.tagName != 'body' && baseTag.tagName != 'BODY') ? 'beforebegin' : 'afterbegin', '<h1 storydoc="name">'+id+content+'</h1>');
  },

  renderScreen: function(tag) {
    if (tag == null) return;
    const css = tag.style.cssText;
    tag.style.display = 'none';
    let content = tag.innerHTML.trim();
    content = this.populateParameterValues(content, this.params);
    tag.insertAdjacentHTML('beforebegin', '<div storydoc="screen"'+this.toAttributesString(tag,['id','name','class'])+' style="border:1px solid black; padding:10px; display:inline-block;'+css+'">'+content+'</div><br><br>');
    //tag.parentNode.removeChild(tag); // screen tag will be used to show no-actions
  },

  renderNotes: function(tags, baseTag) {
    if (tags == null || tags.length == 0) return;
    for (let i=0; i<tags.length; i++) {
      this.renderNote(tags[i], baseTag);
    }
    baseTag.insertAdjacentHTML('beforebegin', '<br>');
    this.removeTags(tags);
  },

  renderNote: function(tag, baseTag) {
    if (tag == null) return;
    const css = tag.style.cssText;
    tag.style.display = 'none';
    baseTag.insertAdjacentHTML('beforebegin', '<span storydoc="note"'+this.toAttributesString(tag,['id','name','class'])+' style="'+css+'">'+tag.innerHTML+'</span><br>');
  },

  renderActions: function(actionTags, exceptionTags, baseTag) {
    if ((actionTags == null || actionTags.length == 0) && (exceptionTags == null || exceptionTags.length == 0)) {
      // no actions
      if (baseTag) {
        if (baseTag.tagName == 'body' || baseTag.tagName == 'BODY') baseTag = document.querySelectorAll("h1[storydoc='name']")[0] || baseTag;
        baseTag.insertAdjacentHTML('afterend', '<h4 style="display:inline;">Actions</h4><br><div style="border:1px solid black; padding:5px; background-color:paleturquoise; display:inline-block;">No actions (end of story)</div><br><br>');
      }
      return;
    }

    const parent = document.createElement("table");
    parent.cellPadding = '0';
    parent.cellSpacing = '0';
    parent.style.border = '1px solid black';

    const sdAttr = document.createAttribute("storydoc");
    sdAttr.value = "actions";
    parent.setAttributeNode(sdAttr);

    if (actionTags != null) {
      for (let i=0; i<actionTags.length; i++) {
        this.renderAction(parent, actionTags[i], i, false);
      }
    }
    if (exceptionTags != null) {
      for (let i=0; i<exceptionTags.length; i++) {
        this.renderAction(parent, exceptionTags[i], i, true);
      }
    }

    const headTag = actionTags != null && actionTags.length > 0 ? actionTags[0] : exceptionTags[0];
    headTag.insertAdjacentHTML('beforebegin', '<h4 storydoc="actions" style="display:inline;">Actions</h4>');
    headTag.insertAdjacentElement('beforebegin', parent);
    headTag.insertAdjacentHTML('beforebegin', '<br>');

    this.removeTags(actionTags);
    this.removeTags(exceptionTags);
  },

  renderAction: function(parent, tag, index, isException) {
    if (tag == null) return;
    const css = tag.style.cssText;
    tag.style.display = 'none';
    const idAttr = tag.getAttribute('id');
    const id = idAttr ? idAttr : (this.params.hasOwnProperty('storydoc_id') ? this.params.storydoc_id||'' : this.toUserStoryID(index+1));
    const idTitle = id && id != "" && (idAttr || !this.params.hasOwnProperty('storydoc_id')) ? '['+id+'] ' : '';
    const link = tag.getAttribute('link');
    const name = tag.getAttribute('name').replace('<','&lt;').replace('>','&gt;') || '';
    const onclickAttrVal = tag.getAttribute('onclick');
    const onclick = onclickAttrVal && onclickAttrVal.trim().length > 0 ? ' onclick="'+onclickAttrVal+'"' : '';
    const bgcolor = isException ? (index % 2 == 0 ? 'pink' : 'peachpuff') : (index % 2 == 0 ? 'paleturquoise' : 'lightcyan');
    const separator = link && link.indexOf('?') == -1 ? '?' : '&';
    const a = link != null ? '<a href="'+link+separator+'storydoc_id='+encodeURIComponent(id)+'&'+'storydoc_name='+encodeURIComponent(name)+'"'+onclick+'>'+idTitle+name+'</a>' : idTitle+name;
    parent.insertAdjacentHTML('beforeend', '<tr style="background-color:'+bgcolor+';"><th style="padding:5px; text-align:left; vertical-align:top;'+css+'">'+a+'</th><td style="padding:5px;'+css+'">'+tag.innerHTML+'</td></tr>');
  },

  toUserStoryID: function(index) {
    return 'US' + (index < 100 ? ('00' + index).slice(-2) : index);
  },

  removeTags: function(tags) {
    if (tags == null) return;
    for (let i=tags.length-1; i>=0; i--) {
      tags[i].parentNode.removeChild(tags[i]);
    }
  },

  toAttributesString: function(tag, names) {
    const buff = [];
    for (let i=0; i<names.length; i++) {
      const name = names[i];
      const value = tag.getAttribute(name);
      if (value) buff.push(' '+name+'="'+value+'"');
    }
    return buff.join('');
  },

  addEventHandler: function(element, type, handler) {
    if (element.addEventListener) {
      element.addEventListener(type, handler, false);
    } else if (element.attachEvent) {
      element.attachEvent('on' + type, handler);
    } else {
      element['on' + type] = handler;
    }
  },

  isEmptyTag: function(tag) {
    return !tag || tag.innerHTML.trim().length == 0;
  }
};

})();

Storydoc.addEventHandler(window, 'load', function() {
  Storydoc.params = Storydoc.createUrlParameterMap();
  Storydoc.initStep();
});
