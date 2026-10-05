'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const local = location.protocol === 'file:' || ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  if (!local) { $('editor').hidden = true; $('local-only').hidden = false; return; }
  const payload = JSON.parse($('editor-payload').textContent);
  const clone = value => JSON.parse(JSON.stringify(value));
  const draftKey = 'danter-family-editor-v1:' + location.pathname;
  const backupKey = draftKey + ':backup';
  let data = clone(payload.data), baseline = clone(payload.data), template = payload.treeTemplate;
  let selected = data.people.find(p => p.name === 'Stephen Danter')?.id || data.people[0]?.id;
  let editing = null, formDirty = false, dirty = false, history = [], draft = null, folder = null, previewURL = null;
  const inverse = { parents: 'children', children: 'parents', partners: 'partners' };
  const label = { parents: 'Parents', partners: 'Partners', children: 'Children' };
  const safeJSON = value => JSON.stringify(value).replace(/</g, '\\u003c');
  const dataPattern = /<script id="family-tree-data" type="application\/json">[\s\S]*?<\/script>/;
  function message(text, error = false) { $('status').textContent = text; $('status').classList.toggle('error', error); }
  function storageSet(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } }
  function removeDraft() { try { localStorage.removeItem(draftKey); } catch {} }
  function stash() {
    const ok = storageSet(draftKey, { data, baseline, saved: new Date().toISOString() });
    if (!ok) message('Your changes are in this tab, but browser draft storage is unavailable. Save or download the website files before closing.', true);
  }
  function statusLine() {
    $('workspace-state').textContent = `${data.people.length} people · ${dirty ? 'Draft changes to save' : 'Website files up to date'}`;
    $('undo').disabled = history.length === 0;
  }
  function renderList() {
    const query = $('people-search').value.trim().toLowerCase();
    const people = data.people.filter(p => p.name.toLowerCase().includes(query)).sort((a,b) => a.name.localeCompare(b.name));
    $('people-count').textContent = `${people.length} of ${data.people.length} people`;
    $('people-list').replaceChildren();
    for (const person of people) {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = person.name;
      button.setAttribute('aria-pressed', String(person.id === selected));
      const small = document.createElement('small'); small.textContent = [person.birth?.date, person.birth?.place].filter(Boolean).join(' · ') || (person.living ? 'Living person' : 'Dates not recorded');
      button.append(small); button.addEventListener('click', () => { if (canLeaveForm()) loadPerson(person.id); });
      $('people-list').append(button);
    }
    statusLine();
  }
  function canLeaveForm() { return !formDirty || confirm('Discard the unapplied edits in this form?'); }
  function privacyFields() {
    for (const id of ['birth-date', 'death-date', 'death-place']) $(id).disabled = $('person-living').checked;
  }
  function loadPerson(id) {
    selected = id;
    editing = clone(data.people.find(p => p.id === id) || { type: 'person', id: 'local:' + crypto.randomUUID(), name: '', sex: '', birth: {}, death: {}, parents: [], partners: [], children: [], famc: [], fams: [], source: 'Local family updates', living: true });
    formDirty = false;
    $('form-title').textContent = id ? 'Edit family member' : 'Add family member';
    $('person-name').value = editing.name;
    $('person-sex').value = editing.sex;
    $('person-living').checked = editing.living;
    $('birth-date').value = editing.birth.date || ''; $('birth-place').value = editing.birth.place || '';
    $('death-date').value = editing.death.date || ''; $('death-place').value = editing.death.place || '';
    privacyFields(); renderRelationships(); renderList();
  }
  function renderRelationships() {
    $('relationships').replaceChildren();
    for (const relation of Object.keys(inverse)) {
      const section = document.createElement('section'); section.className = 'relation-section';
      const title = document.createElement('h3'); title.textContent = label[relation]; section.append(title);
      const chips = document.createElement('div'); chips.className = 'chips';
      for (const id of editing[relation]) {
        const person = data.people.find(p => p.id === id);
        const chip = document.createElement('span'); chip.className = 'chip'; chip.append(document.createTextNode(person?.name || 'Unrecorded person'));
        const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '×'; remove.setAttribute('aria-label', `Remove ${person?.name || 'person'} from ${label[relation].toLowerCase()}`);
        remove.addEventListener('click', () => { editing[relation] = editing[relation].filter(x => x !== id); formDirty = true; renderRelationships(); });
        chip.append(remove); chips.append(chip);
      }
      section.append(chips);
      const row = document.createElement('div'); row.className = 'relation-add';
      const select = document.createElement('select'); select.setAttribute('aria-label', `Choose ${label[relation].toLowerCase()}`);
      const empty = document.createElement('option'); empty.value = ''; empty.textContent = 'Choose an existing family member…'; select.append(empty);
      for (const person of [...data.people].sort((a,b) => a.name.localeCompare(b.name))) {
        if (person.id === editing.id || editing[relation].includes(person.id)) continue;
        const option = document.createElement('option'); option.value = person.id; option.textContent = person.name + (person.birth?.date ? ` (${person.birth.date})` : ''); select.append(option);
      }
      const add = document.createElement('button'); add.type = 'button'; add.textContent = 'Add'; add.setAttribute('aria-label', `Add to ${label[relation].toLowerCase()}`);
      add.addEventListener('click', () => { if (select.value) { editing[relation].push(select.value); formDirty = true; renderRelationships(); } });
      row.append(select, add); section.append(row); $('relationships').append(section);
    }
  }
  function cycle(data) {
    const map = new Map(data.people.map(p => [p.id,p])), visited = new Set(), active = new Set();
    function visit(id) {
      if (active.has(id)) return true;
      if (visited.has(id)) return false;
      active.add(id);
      for (const next of map.get(id)?.children || []) if (visit(next)) return true;
      active.delete(id); visited.add(id); return false;
    }
    return data.people.some(p => visit(p.id));
  }
  function publicData(input) {
    const result = clone(input);
    for (const person of result.people) if (person.living) { delete person.birth.date; person.death = {}; }
    return result;
  }
  $('person-form').addEventListener('input', () => { formDirty = true; });
  $('person-living').addEventListener('change', privacyFields);
  $('person-form').addEventListener('submit', event => {
    event.preventDefault();
    const name = $('person-name').value.trim();
    if (!name) { message('Please enter a name.', true); return; }
    const next = clone(data), person = clone(editing);
    person.name = name; person.sex = $('person-sex').value; person.living = $('person-living').checked;
    person.birth = { ...person.birth, place: $('birth-place').value.trim() };
    if (!person.living) person.birth.date = $('birth-date').value.trim(); else delete person.birth.date;
    person.death = person.living ? {} : { ...person.death, date: $('death-date').value.trim(), place: $('death-place').value.trim() };
    const old = next.people.find(p => p.id === person.id);
    for (const relation of Object.keys(inverse)) {
      for (const relative of next.people) {
        if ((old?.[relation] || []).includes(relative.id) && !person[relation].includes(relative.id)) relative[inverse[relation]] = relative[inverse[relation]].filter(id => id !== person.id);
        if (person[relation].includes(relative.id) && !relative[inverse[relation]].includes(person.id)) relative[inverse[relation]].push(person.id);
      }
    }
    if (old) next.people[next.people.indexOf(old)] = person; else next.people.push(person);
    if (cycle(next)) { message('This relationship would make someone their own ancestor. Please check the parents and children.', true); return; }
    storageSet(backupKey, data);
    history.push(clone(data)); if (history.length > 20) history.shift();
    data = next; dirty = true; loadPerson(person.id); message(`${person.name} has been updated in your draft. Save website files when you have finished.`); stash();
  });
  $('add-person').addEventListener('click', () => { if (canLeaveForm()) { loadPerson(null); $('person-name').focus(); } });
  $('cancel-person').addEventListener('click', () => { if (canLeaveForm()) loadPerson(selected || data.people[0]?.id); });
  $('people-search').addEventListener('input', renderList);
  $('undo').addEventListener('click', () => {
    if (!history.length || !canLeaveForm()) return;
    data = history.pop(); dirty = JSON.stringify(data) !== JSON.stringify(baseline);
    loadPerson(data.people.some(p => p.id === selected) ? selected : data.people[0]?.id); message('Last applied change undone.'); if (dirty) stash(); else removeDraft();
  });
  function treeHTML(result, source = template) {
    if (!dataPattern.test(source)) throw new Error('This tree file does not contain the editable records. Open the updated family-tree.html first.');
    return source.replace(dataPattern, () => `<script id="family-tree-data" type="application/json">${safeJSON(result)}</script>`);
  }
  function editorHTML(result, tree) {
    const copy = document.documentElement.cloneNode(true);
    copy.querySelector('#editor').removeAttribute('inert');
    copy.querySelector('#save-files').disabled = false;
    copy.querySelector('#editor-payload').textContent = safeJSON({ data: result, treeTemplate: tree });
    copy.querySelector('#people-list').replaceChildren(); copy.querySelector('#relationships').replaceChildren();
    copy.querySelector('#workspace-state').textContent = '';
    copy.querySelector('#draft-banner').hidden = true;
    copy.querySelector('#status').textContent = 'Choose a person to edit, or add a family member.';
    copy.querySelector('#status').classList.remove('error');
    copy.querySelector('#preview-dialog').removeAttribute('open'); copy.querySelector('iframe').removeAttribute('src');
    return '<!doctype html>\n' + copy.outerHTML;
  }
  function finishedFiles(source = template) {
    const result = publicData(data); result.generated = new Date().toISOString();
    const tree = treeHTML(result, source);
    return { result, tree, files: { 'family-tree.html': tree, 'family-data.json': JSON.stringify(result, null, 2) + '\n', 'edit-tree.html': editorHTML(result, tree) } };
  }
  function hasUnapplied() {
    if (!formDirty) return false;
    message('Apply or cancel the edits in the form before previewing or saving.', true); return true;
  }
  function download(name, contents, type = 'text/html') {
    const url = URL.createObjectURL(new Blob([contents], { type }));
    const link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  $('preview').addEventListener('click', () => {
    if (hasUnapplied()) return;
    if (previewURL) URL.revokeObjectURL(previewURL);
    previewURL = URL.createObjectURL(new Blob([treeHTML(publicData(data))], { type: 'text/html' }));
    $('preview-dialog').querySelector('iframe').src = previewURL; $('preview-dialog').showModal();
  });
  $('close-preview').addEventListener('click', () => $('preview-dialog').close());
  $('download-files').addEventListener('click', () => {
    if (hasUnapplied()) return;
    const { files } = finishedFiles();
    for (const [name, text] of Object.entries(files)) download(name, text, name.endsWith('.json') ? 'application/json' : 'text/html');
    message('Downloaded family-tree.html, family-data.json and edit-tree.html. Replace all three files in your family-tree folder, then push to GitHub. Allow multiple downloads if your browser asks.');
  });
  $('save-files').addEventListener('click', async () => {
    if (hasUnapplied()) return;
    if (!window.showDirectoryPicker) { message('This browser cannot save directly to a folder. Use Download website files, or open this editor in Edge or Chrome.'); return; }
    $('save-files').disabled = true;
    $('editor').inert = true;
    try {
      if (!folder) folder = await window.showDirectoryPicker({ mode: 'readwrite', id: 'danter-family-tree-save-v2' });
      const file = await folder.getFileHandle('family-tree.html');
      const current = await (await file.getFile()).text();
      const parsed = new DOMParser().parseFromString(current, 'text/html').getElementById('family-tree-data');
      if (!parsed) throw new Error('Choose the family-tree folder containing the updated family-tree.html file.');
      const onDisk = JSON.parse(parsed.textContent);
      if (JSON.stringify(onDisk) !== JSON.stringify(baseline)) throw new Error('The records in that folder have changed since you opened this editor. Use Open saved tree to load the latest file before editing, or download your draft to keep a separate copy.');
      const built = finishedFiles(current);
      // Keep the previous website files outside the published repository.
      storageSet(backupKey, baseline);
      const writes = [];
      for (const [name, text] of Object.entries(built.files)) {
        const handle = await folder.getFileHandle(name, { create: true });
        writes.push({ handle, text });
      }
      for (const { handle, text } of writes) { const writer = await handle.createWritable(); await writer.write(text); await writer.close(); }
      data = clone(built.result); baseline = clone(built.result); template = built.tree; dirty = false; history = []; removeDraft(); renderList();
      message('Website files saved. Refresh family-tree.html to see your changes, then commit and push the updated files to GitHub.');
    } catch (error) {
      if (error.name !== 'AbortError') { folder = null; message('Files were not fully saved: ' + error.message + ' Your draft is still available.', true); }
    } finally { $('save-files').disabled = false; $('editor').inert = false; }
  });
  $('open-tree').addEventListener('click', () => {
    if (!canLeaveForm() || (dirty && !confirm('Replace this draft with the records from a saved tree? Download your draft first if you want to keep it.'))) return;
    $('import-file').click();
  });
  $('import-file').addEventListener('change', async () => {
    const file = $('import-file').files[0]; if (!file) return;
    try {
      const html = await file.text(); const doc = new DOMParser().parseFromString(html, 'text/html');
      const node = doc.getElementById('family-tree-data'); if (!node) throw new Error('Choose a family-tree.html saved by this editor.');
      const imported = JSON.parse(node.textContent); validate(imported);
      template = html; data = publicData(imported); baseline = clone(imported); history = []; dirty = false; folder = null; removeDraft();
      loadPerson(data.people[0]?.id); message(`Opened ${file.name}. You can now edit these records.`);
    } catch (error) { message(error.message, true); }
    $('import-file').value = '';
  });
  function validate(candidate) {
    if (!candidate || !Array.isArray(candidate.people) || !Array.isArray(candidate.sources) || !candidate.people.length) throw new Error('The tree records are incomplete.');
    const ids = new Set();
    for (const p of candidate.people) {
      if (typeof p.id !== 'string' || !p.id || ids.has(p.id) || typeof p.name !== 'string' || !p.name.trim() || !p.birth || !p.death || typeof p.living !== 'boolean' || Object.keys(inverse).some(r => !Array.isArray(p[r]) || p[r].some(id => typeof id !== 'string'))) throw new Error('The file contains invalid family records.');
      ids.add(p.id);
    }
    if (cycle(candidate)) throw new Error('The file contains a circular parent/child relationship.');
  }
  $('restore-draft').addEventListener('click', () => {
    try {
      validate(draft.data);
      if (JSON.stringify(draft.baseline) !== JSON.stringify(baseline)) throw new Error('This draft belongs to an older saved tree. Download a backup of it before making changes to the current records.');
      data = clone(draft.data); dirty = true; history = []; $('draft-banner').hidden = true; loadPerson(data.people[0]?.id); message('Browser draft restored.');
    } catch (error) { message(error.message, true); }
  });
  $('download-draft').addEventListener('click', () => { if (draft?.data) download('family-tree-draft.html', treeHTML(publicData(draft.data))); });
  $('download-backup').addEventListener('click', () => {
    try {
      const previous = JSON.parse(localStorage.getItem(backupKey) || 'null');
      if (!previous) { message('A backup is created when you first apply a change.'); return; }
      download('family-tree-backup.html', treeHTML(publicData(previous)));
      message('Downloaded the previous records as family-tree-backup.html. Open saved tree can load this backup.');
    } catch (error) { message('Could not read the browser backup: ' + error.message, true); }
  });
  $('discard-draft').addEventListener('click', () => { if (confirm('Discard the saved browser draft?')) { removeDraft(); $('draft-banner').hidden = true; } });
  window.addEventListener('beforeunload', event => { if (formDirty || dirty) { event.preventDefault(); event.returnValue = ''; } });
  try {
    draft = JSON.parse(localStorage.getItem(draftKey) || 'null');
    if (draft?.data && JSON.stringify(publicData(draft.data).people) === JSON.stringify(data.people)) { removeDraft(); draft = null; }
    $('draft-banner').hidden = !draft;
  } catch {}
  loadPerson(selected);
})();
