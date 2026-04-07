import { useState } from "react";
import { Check, X, Plus, Trash2, Loader2 } from "lucide-react";
import { api } from "../../lib/api";

interface Activity {
  id: number;
  title: string;
  type: string;
  duration: string;
  difficulty: string;
  description: string;
  steps: string[];
  curriculumRef: string;
  completed: boolean;
}

interface Props {
  activity: Activity;
  onSave: (updated: Activity) => void;
  onCancel: () => void;
}

export function ActivityEditForm({ activity, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(activity.title);
  const [description, setDescription] = useState(activity.description);
  const [steps, setSteps] = useState<string[]>(
    activity.steps.length > 0 ? [...activity.steps] : [""]
  );
  const [curriculumRef, setCurriculumRef] = useState(activity.curriculumRef);
  const [saving, setSaving] = useState(false);

  const updateStep = (i: number, value: string) => {
    const next = [...steps];
    next[i] = value;
    setSteps(next);
  };

  const addStep = () => setSteps([...steps, ""]);

  const removeStep = (i: number) => {
    if (steps.length === 1) return;
    setSteps(steps.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.put<Activity>(`/teacher/activities/${activity.id}`, {
        title: title.trim() || null,
        description: description.trim() || null,
        steps: steps.filter(s => s.trim()),
        curriculum_ref: curriculumRef.trim() || null,
      });
      onSave(updated);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 p-4 rounded-xl border-2 space-y-3" style={{ borderColor: "#BFDBFE", backgroundColor: "#F0F9FF" }}>
      {/* Title */}
      <div>
        <label className="block text-xs mb-1" style={{ fontWeight: 600, color: "#374151" }}>Title</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
          style={{ color: "#1E293B" }}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs mb-1" style={{ fontWeight: 600, color: "#374151" }}>Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
          style={{ color: "#1E293B", lineHeight: "1.6" }}
        />
      </div>

      {/* Steps */}
      <div>
        <label className="block text-xs mb-1.5" style={{ fontWeight: 600, color: "#374151" }}>Steps</label>
        <div className="space-y-1.5">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs w-5 text-right shrink-0" style={{ color: "#94A3B8" }}>{i + 1}.</span>
              <input
                value={step}
                onChange={e => updateStep(i, e.target.value)}
                className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                style={{ color: "#1E293B" }}
                placeholder={`Step ${i + 1}`}
              />
              <button
                onClick={() => removeStep(i)}
                disabled={steps.length === 1}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors"
              >
                <Trash2 size={13} style={{ color: steps.length === 1 ? "#CBD5E1" : "#EF4444" }} />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addStep}
          className="flex items-center gap-1 mt-1.5 text-xs hover:underline"
          style={{ color: "#2563EB" }}
        >
          <Plus size={12} /> Add step
        </button>
      </div>

      {/* Curriculum Ref */}
      <div>
        <label className="block text-xs mb-1" style={{ fontWeight: 600, color: "#374151" }}>
          Curriculum Reference{" "}
          <span style={{ color: "#94A3B8", fontWeight: 400 }}>(URL or code)</span>
        </label>
        <input
          value={curriculumRef}
          onChange={e => setCurriculumRef(e.target.value)}
          className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
          style={{ color: "#1E293B" }}
          placeholder="e.g. https://australiancurriculum.edu.au/... or ACMNA123"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-slate-200 hover:bg-white transition-colors"
          style={{ color: "#64748B" }}
        >
          <X size={12} /> Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          style={{ backgroundColor: "#2563EB", fontWeight: 600 }}
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
