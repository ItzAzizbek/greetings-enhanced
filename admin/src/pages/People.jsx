import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api.js';
import { Button, Card, EmptyState, Input, Pill, Textarea } from '../components/UI.jsx';

// ── datetime helpers ──────────────────────────────────────────────────
function toLocalInput(ms) {
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}
function fromLocalInput(s) {
  const t = new Date(s).getTime();
  return Number.isFinite(t) ? t : null;
}
function formatStarDate(ms) {
  return new Date(ms).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function SkyPanel({ person }) {
  const [stars, setStars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draftAt, setDraftAt] = useState(toLocalInput(Date.now()));
  const [draftLabel, setDraftLabel] = useState('');
  const [draftPinned, setDraftPinned] = useState(false);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState({}); // per-star id → 'edit'|'delete'|'pin'
  const [editing, setEditing] = useState(null); // starId currently being edited
  const [editDraft, setEditDraft] = useState({ at: '', label: '' });

  async function refresh() {
    setLoading(true);
    try {
      const { stars } = await api.listStars(person.id);
      // Newest first for the admin list (the kiosk re-sorts for drawing).
      setStars([...stars].sort((a, b) => b.at - a.at));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [person.id]);

  async function onAdd(e) {
    e.preventDefault();
    const at = fromLocalInput(draftAt);
    if (!at) return;
    setAdding(true);
    try {
      await api.addStar(person.id, {
        at,
        label: draftLabel.trim() || null,
        pinned: draftPinned,
      });
      setDraftAt(toLocalInput(Date.now()));
      setDraftLabel('');
      setDraftPinned(false);
      refresh();
    } finally {
      setAdding(false);
    }
  }

  async function onTogglePin(star) {
    setBusy((b) => ({ ...b, [star.id]: 'pin' }));
    try {
      await api.updateStar(star.id, { pinned: !star.pinned });
      setStars((list) =>
        list.map((s) => (s.id === star.id ? { ...s, pinned: !s.pinned } : s)),
      );
    } finally {
      setBusy((b) => ({ ...b, [star.id]: null }));
    }
  }

  async function onDelete(star) {
    if (!confirm('Remove this star from their sky?')) return;
    setBusy((b) => ({ ...b, [star.id]: 'delete' }));
    try {
      await api.deleteStar(star.id);
      setStars((list) => list.filter((s) => s.id !== star.id));
    } finally {
      setBusy((b) => ({ ...b, [star.id]: null }));
    }
  }

  function startEdit(star) {
    setEditing(star.id);
    setEditDraft({ at: toLocalInput(star.at), label: star.label || '' });
  }

  async function saveEdit(star) {
    const at = fromLocalInput(editDraft.at);
    if (!at) return;
    setBusy((b) => ({ ...b, [star.id]: 'edit' }));
    try {
      await api.updateStar(star.id, { at, label: editDraft.label.trim() || null });
      setEditing(null);
      refresh();
    } finally {
      setBusy((b) => ({ ...b, [star.id]: null }));
    }
  }

  const pinnedCount = useMemo(() => stars.filter((s) => s.pinned).length, [stars]);

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-sm font-medium">{person.name}&rsquo;s sky</div>
          <div className="text-xs text-muted mt-0.5">
            {loading
              ? 'Loading constellation…'
              : `${stars.length} ${stars.length === 1 ? 'star' : 'stars'}${
                  pinnedCount ? ` · ${pinnedCount} pinned` : ''
                }`}
          </div>
        </div>
      </div>

      <Card className="p-4 bg-sunken/40">
        <form onSubmit={onAdd} className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr_auto_auto] gap-3 items-end">
          <Input
            label="When"
            type="datetime-local"
            value={draftAt}
            onChange={(e) => setDraftAt(e.target.value)}
          />
          <Input
            label="Label (optional)"
            placeholder="Birthday visit · First day · A good morning"
            value={draftLabel}
            onChange={(e) => setDraftLabel(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm text-ink h-10">
            <input
              type="checkbox"
              checked={draftPinned}
              onChange={(e) => setDraftPinned(e.target.checked)}
              className="accent-sage"
            />
            Pin
          </label>
          <Button type="submit" disabled={adding}>
            {adding ? 'Adding…' : 'Add star'}
          </Button>
        </form>
        <p className="text-xs text-muted mt-2">
          Pinned stars glow on the display and can carry a whispered label.
        </p>
      </Card>

      {loading ? (
        <div className="text-muted text-sm">Loading…</div>
      ) : stars.length === 0 ? (
        <EmptyState
          title="No stars yet"
          hint="Detections add stars automatically. You can also place curated ones here."
        />
      ) : (
        <ul className="divide-y divide-line rounded-xl2 border border-line bg-surface">
          {stars.map((star) => {
            const isEditing = editing === star.id;
            const busyKind = busy[star.id];
            return (
              <li key={star.id} className="p-3 flex items-center gap-3">
                <div
                  className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                    star.pinned ? 'bg-sage shadow-[0_0_0_3px_rgba(47,93,82,0.18)]' : 'bg-line'
                  }`}
                />
                {isEditing ? (
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_1.4fr_auto_auto] gap-2 items-center">
                    <input
                      type="datetime-local"
                      value={editDraft.at}
                      onChange={(e) =>
                        setEditDraft((d) => ({ ...d, at: e.target.value }))
                      }
                      className="h-9 rounded-lg border border-line bg-surface px-3 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Label"
                      value={editDraft.label}
                      onChange={(e) =>
                        setEditDraft((d) => ({ ...d, label: e.target.value }))
                      }
                      className="h-9 rounded-lg border border-line bg-surface px-3 text-sm"
                    />
                    <Button
                      variant="outline"
                      onClick={() => setEditing(null)}
                      type="button"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => saveEdit(star)}
                      disabled={busyKind === 'edit'}
                      type="button"
                    >
                      {busyKind === 'edit' ? 'Saving…' : 'Save'}
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm flex items-center gap-2 flex-wrap">
                        <span className="text-ink">{formatStarDate(star.at)}</span>
                        {star.label && (
                          <span className="text-muted">· {star.label}</span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <Pill tone={star.source === 'manual' ? 'sage' : 'neutral'}>
                          {star.source === 'manual' ? 'curated' : 'auto'}
                        </Pill>
                        {star.pinned && <Pill tone="sage">pinned</Pill>}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => onTogglePin(star)}
                      disabled={busyKind === 'pin'}
                    >
                      {star.pinned ? 'Unpin' : 'Pin'}
                    </Button>
                    <Button variant="outline" onClick={() => startEdit(star)}>
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => onDelete(star)}
                      disabled={busyKind === 'delete'}
                    >
                      Remove
                    </Button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Avatar({ src, name, size = 'md' }) {
  const sizes = { sm: 'h-9 w-9 text-sm', md: 'h-10 w-10 text-sm', lg: 'h-20 w-20 text-xl' };
  return (
    <div
      className={`${sizes[size]} rounded-full bg-sunken overflow-hidden flex-shrink-0 grid place-items-center text-muted`}
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span>{name?.[0]?.toUpperCase() ?? '·'}</span>
      )}
    </div>
  );
}

function PhotoPicker({ currentUrl, onFile, onRemove }) {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [pickedFile, setPickedFile] = useState(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function pick(file) {
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setPickedFile(file);
    onFile?.(file);
  }

  function clear() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPickedFile(null);
    onFile?.(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  const showSrc = previewUrl || currentUrl;

  return (
    <div>
      <div className="text-sm text-muted mb-1.5">Photo</div>
      <div className="flex items-center gap-4">
        <Avatar src={showSrc} name="?" size="lg" />
        <div className="flex-1 min-w-0">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0])}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
            >
              {showSrc ? 'Replace photo' : 'Upload photo'}
            </Button>
            {pickedFile && (
              <Button type="button" variant="ghost" onClick={clear}>
                Cancel
              </Button>
            )}
            {!pickedFile && currentUrl && onRemove && (
              <Button type="button" variant="danger" onClick={onRemove}>
                Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-muted mt-2">
            {pickedFile
              ? `${pickedFile.name} · ${(pickedFile.size / 1024).toFixed(0)} KB`
              : 'JPG, PNG, or WebP. Up to 5 MB.'}
          </p>
        </div>
      </div>
    </div>
  );
}

function PersonRow({ person, onSave, onRemove, onTrigger }) {
  const [editing, setEditing] = useState(false);
  const [showSky, setShowSky] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(() => ({
    name: person.name || '',
    greeting: person.greeting || '',
    linkedUserId: person.linkedUserId || '',
    birthday: person.birthday || '',
  }));
  const [photoFile, setPhotoFile] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);

  async function handleTrigger() {
    setTriggering(true);
    try {
      await onTrigger(person.id);
      setTriggered(true);
      setTimeout(() => setTriggered(false), 1500);
    } finally {
      setTriggering(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(person.id, {
        name: draft.name,
        greeting: draft.greeting,
        linkedUserId: draft.linkedUserId,
        // Always send birthday — empty string clears it on the backend.
        birthday: draft.birthday,
        photoFile,
        removePhoto,
      });
      setEditing(false);
      setPhotoFile(null);
      setRemovePhoto(false);
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <li>
        <div className="flex items-center gap-4 p-4">
          <Avatar src={person.photoUrl} name={person.name} />
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate flex items-center gap-2">
              {person.name}
              {triggered && <Pill tone="sage">triggered</Pill>}
            </div>
            <div className="text-xs text-muted truncate">{person.greeting}</div>
          </div>
          <div className="text-right text-xs text-muted">
            <div>
              <span className="tabular-nums">{person.entries ?? 0}</span> visits
            </div>
            <div>
              streak <span className="tabular-nums">{person.streak ?? 0}</span>
            </div>
          </div>
          <Button variant="outline" onClick={handleTrigger} disabled={triggering}>
            {triggering ? '…' : 'Test'}
          </Button>
          <Button
            variant={showSky ? 'primary' : 'outline'}
            onClick={() => setShowSky((v) => !v)}
          >
            {showSky ? 'Close sky' : 'Sky'}
          </Button>
          <Button variant="outline" onClick={() => setEditing(true)}>
            Edit
          </Button>
          <Button variant="danger" onClick={() => onRemove(person.id)}>
            Remove
          </Button>
        </div>
        {showSky && (
          <div className="px-6 pb-6">
            <SkyPanel person={person} />
          </div>
        )}
      </li>
    );
  }

  return (
    <li className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <PhotoPicker
          currentUrl={removePhoto ? null : person.photoUrl}
          onFile={(file) => {
            setPhotoFile(file);
            if (file) setRemovePhoto(false);
          }}
          onRemove={() => {
            setRemovePhoto(true);
            setPhotoFile(null);
          }}
        />
      </div>
      <Input
        label="Name"
        value={draft.name}
        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
      />
      <Input
        label="Linked user UID (optional)"
        value={draft.linkedUserId}
        onChange={(e) => setDraft({ ...draft, linkedUserId: e.target.value })}
      />
      <Input
        label="Birthday (optional)"
        type="date"
        value={draft.birthday}
        onChange={(e) => setDraft({ ...draft, birthday: e.target.value })}
        hint="On the day, the display switches to a birthday greeting and pins a star."
      />
      <div /> {/* spacer to keep the two-column rhythm */}
      <div className="md:col-span-2">
        <Textarea
          label="Greeting"
          value={draft.greeting}
          onChange={(e) => setDraft({ ...draft, greeting: e.target.value })}
        />
      </div>
      <div className="md:col-span-2 flex justify-end gap-2">
        <Button
          variant="ghost"
          onClick={() => {
            setEditing(false);
            setPhotoFile(null);
            setRemovePhoto(false);
          }}
        >
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </li>
  );
}

export default function People() {
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', greeting: '', linkedUserId: '', birthday: '' });
  const [photoFile, setPhotoFile] = useState(null);
  const [error, setError] = useState(null);

  async function refresh() {
    setLoading(true);
    try {
      const { persons } = await api.listPersons();
      setPersons(persons);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
  }, []);

  function resetForm() {
    setForm({ name: '', greeting: '', linkedUserId: '', birthday: '' });
    setPhotoFile(null);
    setError(null);
  }

  async function onCreate(e) {
    e.preventDefault();
    if (!form.name) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.createPerson({
        name: form.name,
        greeting: form.greeting,
        linkedUserId: form.linkedUserId,
        birthday: form.birthday || null,
        photoFile,
      });
      resetForm();
      setCreating(false);
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function onSave(id, updates) {
    await api.updatePerson(id, updates);
    refresh();
  }

  async function onRemove(id) {
    if (!confirm('Remove this person?')) return;
    await api.deletePerson(id);
    refresh();
  }

  async function onTrigger(id) {
    await api.triggerDetection(id);
    refresh();
  }

  return (
    <div className="max-w-5xl mx-auto px-10 py-12">
      <header className="flex items-end justify-between mb-10">
        <div>
          <h1 className="font-display text-3xl">People</h1>
          <p className="text-muted mt-1">
            Anyone listed here gets a personal greeting on the display.
          </p>
        </div>
        <Button
          onClick={() => {
            if (creating) resetForm();
            setCreating((v) => !v);
          }}
        >
          {creating ? 'Cancel' : 'Add person'}
        </Button>
      </header>

      {creating && (
        <Card className="p-6 mb-8">
          <form onSubmit={onCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <PhotoPicker onFile={setPhotoFile} />
            </div>
            <Input
              label="Name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Linked user UID (optional)"
              hint="Connect this entry to a Firebase user."
              value={form.linkedUserId}
              onChange={(e) => setForm({ ...form, linkedUserId: e.target.value })}
            />
            <Input
              label="Birthday (optional)"
              type="date"
              hint="The display will switch to a birthday greeting on the day."
              value={form.birthday}
              onChange={(e) => setForm({ ...form, birthday: e.target.value })}
            />
            <div /> {/* spacer */}
            <div className="md:col-span-2">
              <Textarea
                label="Greeting (shown on the display)"
                placeholder="Welcome back, Alex."
                value={form.greeting}
                onChange={(e) => setForm({ ...form, greeting: e.target.value })}
              />
            </div>
            {error && (
              <div className="md:col-span-2 text-[#B85C38] text-sm">{error}</div>
            )}
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="text-muted text-sm">Loading…</div>
      ) : persons.length === 0 ? (
        <EmptyState
          title="No one here yet"
          hint="Add the first person to start triggering personal greetings."
          action={<Button onClick={() => setCreating(true)}>Add person</Button>}
        />
      ) : (
        <ul className="divide-y divide-line rounded-xl2 border border-line bg-surface">
          {persons.map((p) => (
            <PersonRow
              key={p.id}
              person={p}
              onSave={onSave}
              onRemove={onRemove}
              onTrigger={onTrigger}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
