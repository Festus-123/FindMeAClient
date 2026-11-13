"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { createAd } from "../actions/ads";
import type { FormState } from "../actions/auth";
import { AD_HOURS, CATEGORIES, DETAIL_PRESETS, PRICING } from "@/lib/config";
import { naira, quoteAd } from "@/lib/pricing";
import Icon, { CATEGORY_ICONS, type IconName } from "./Icon";
import { ErrorMessage, Select, SubmitButton } from "./ui";

interface Props {
  freeAdAvailable: boolean;
  /** Lowercased cause → how many ads the client already has for it. */
  causeCounts: Record<string, number>;
}

const STEPS: { title: string; hint: string; icon: IconName }[] = [
  { title: "The basics", hint: "What are you offering?", icon: "pen" },
  { title: "Flyer or image", hint: "Make it stand out", icon: "image" },
  { title: "Reach", hint: "Keywords and how to apply", icon: "tag" },
  { title: "Details and team", hint: "Extras, co-hosts, runtime", icon: "users" },
  { title: "Review", hint: "Check it and go live", icon: "check" },
];

const METHODS: { value: "inbox" | "email" | "phone" | "link"; label: string; hint: string; icon: IconName; placeholder?: string }[] = [
  { value: "inbox", label: "In the app", hint: "People message you here. Replies land in your inbox.", icon: "send" },
  { value: "email", label: "Email", hint: "Applicants write to an address you choose.", icon: "mail", placeholder: "jobs@yourcompany.com" },
  { value: "phone", label: "Phone / WhatsApp", hint: "Applicants call or text a number.", icon: "phone", placeholder: "+234 801 234 5678" },
  { value: "link", label: "Website link", hint: "Send people to your own form or page.", icon: "link", placeholder: "https://yourcompany.com/apply" },
];

const MAX_IMAGE = 2 * 1024 * 1024;

export default function AdForm({ freeAdAvailable, causeCounts }: Props) {
  const [state, action] = useActionState<FormState, FormData>(createAd, {});
  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState("");

  // Everything is controlled so a server error never wipes what was typed (React 19 resets uncontrolled fields).
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [cause, setCause] = useState("");
  const [description, setDescription] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);
  const [filePreview, setFilePreview] = useState("");
  const [fileName, setFileName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageMode, setImageMode] = useState<"upload" | "url">("upload");
  const [adoptable, setAdoptable] = useState(false);
  const [dragging, setDragging] = useState(false);

  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordDraft, setKeywordDraft] = useState("");
  const [method, setMethod] = useState<(typeof METHODS)[number]["value"]>("inbox");
  const [methodValue, setMethodValue] = useState("");

  const [enabled, setEnabled] = useState<string[]>([]);
  const [custom, setCustom] = useState<{ label: string; value: string }[]>([]);
  const [detailValues, setDetailValues] = useState<Record<string, string>>({});
  const [cohostText, setCohostText] = useState("");
  const [hours, setHours] = useState<number>(24);

  useEffect(() => () => { if (filePreview) URL.revokeObjectURL(filePreview); }, [filePreview]);

  const cohostCount = cohostText.split(",").map((s) => s.trim()).filter(Boolean).length;
  const effectiveCause = (cause || title).trim().toLowerCase();

  // Same pure function the server uses, so the preview always matches the charge.
  const quote = useMemo(
    () =>
      quoteAd({
        priorAdsInCause: causeCounts[effectiveCause] ?? 0,
        freeAdAvailable,
        cohostCount: Math.min(cohostCount, PRICING.maxCohosts),
        hours,
      }),
    [causeCounts, effectiveCause, freeAdAvailable, cohostCount, hours],
  );

  const toggle = (k: string) => setEnabled((e) => (e.includes(k) ? e.filter((x) => x !== k) : [...e, k]));

  function pickFile(file: File | undefined) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) return setStepError("Images must be PNG, JPG or WebP.");
    if (file.size > MAX_IMAGE) return setStepError("Images must be under 2 MB.");
    setStepError("");
    if (fileRef.current) {
      const dt = new DataTransfer();
      dt.items.add(file);
      fileRef.current.files = dt.files;
    }
    setFilePreview(URL.createObjectURL(file));
    setFileName(file.name);
  }

  function clearFile() {
    if (fileRef.current) fileRef.current.value = "";
    setFilePreview("");
    setFileName("");
  }

  function addKeyword(raw: string) {
    const parts = raw.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean);
    if (!parts.length) return;
    setKeywords((cur) => [...new Set([...cur, ...parts])].slice(0, 10));
    setKeywordDraft("");
  }

  function validate(s: number): string {
    if (s === 0) {
      if (title.trim().length < 4) return "Give the ad a title of at least 4 characters.";
      if (!category) return "Pick a category.";
      if (description.trim().length < 20) return "Describe the role in at least 20 characters.";
    }
    if (s === 1 && imageMode === "url" && imageUrl.trim() && !/^https?:\/\/\S+$/i.test(imageUrl.trim())) {
      return "The image link must start with http:// or https://.";
    }
    if (s === 2 && method !== "inbox") {
      const v = methodValue.trim();
      if (method === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email for applications.";
      if (method === "phone" && v.replace(/\D/g, "").length < 7) return "Enter a valid phone or WhatsApp number.";
      if (method === "link" && !/^https?:\/\/\S+$/i.test(v)) return "Application link must start with http:// or https://.";
    }
    return "";
  }

  function go(to: number) {
    // Going forward checks every step on the way; going back is always allowed.
    if (to > step) {
      for (let s = step; s < to; s++) {
        const err = validate(s);
        if (err) {
          setStepError(err);
          setStep(s);
          return;
        }
      }
    }
    setStepError("");
    setStep(to);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const previewImage = imageMode === "upload" ? filePreview : /^https?:\/\/\S+$/i.test(imageUrl.trim()) ? imageUrl.trim() : "";
  const detailsFilled = enabled.filter((p) => detailValues[p]?.trim());
  const shown = (i: number) => (step === i ? "space-y-6" : "hidden");

  return (
    <form
      action={action}
      className="grid gap-8 lg:grid-cols-[1fr_22rem]"
      // Enter inside a field should never submit half a form.
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") e.preventDefault();
      }}
    >
      <div className="space-y-8">
        {/* Stepper */}
        <ol className="grid grid-cols-5 gap-1">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <button
                type="button"
                onClick={() => go(i)}
                aria-current={i === step ? "step" : undefined}
                className={`flex w-full flex-col items-center gap-1.5 px-1 py-3 text-center transition-colors duration-150 ${
                  i === step ? "bg-ink text-on-ink" : i < step ? "bg-green-soft text-green" : "bg-surface text-muted hover:bg-red-soft"
                }`}
              >
                <Icon name={i < step ? "check" : s.icon} size={18} />
                <span className="hidden text-[11px] font-extrabold uppercase tracking-wide sm:block">{s.title}</span>
                <span className="text-[11px] font-extrabold sm:hidden">{i + 1}</span>
              </button>
            </li>
          ))}
        </ol>

        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted">Step {step + 1} of {STEPS.length}</p>
          <h2 className="text-2xl font-extrabold">{STEPS[step].title}</h2>
          <p className="text-sm text-muted">{STEPS[step].hint}</p>
        </div>

        {/* 1 · Basics */}
        <section className={shown(0)}>
          <div>
            <label htmlFor="title" className="mb-1.5 block text-sm font-bold">Title</label>
            <input id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} placeholder="e.g. Web developer for a delivery startup" className="field" />
            <p className="mt-1 text-right text-xs text-muted">{title.length}/100</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="mb-1.5 block text-sm font-bold">Category</span>
              <Select name="category" options={CATEGORIES.map((c) => ({ value: c, label: c }))} placeholder="Pick a category" onChange={setCategory} />
            </div>
            <div>
              <label htmlFor="cause" className="mb-1.5 block text-sm font-bold">Cause <span className="font-medium text-muted">(optional)</span></label>
              <input id="cause" name="cause" value={cause} onChange={(e) => setCause(e.target.value)} maxLength={80} placeholder="Same cause = repeat ads cost more" className="field" />
            </div>
          </div>
          <div>
            <label htmlFor="description" className="mb-1.5 block text-sm font-bold">Description</label>
            <textarea id="description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={7} maxLength={2000} placeholder="What is the work, who are you looking for, and why should they care?" className="field" />
            <p className="mt-1 text-right text-xs text-muted">{description.length}/2000</p>
          </div>
        </section>

        {/* 2 · Flyer or image. The file input stays mounted so it always posts. */}
        <section className={shown(1)}>
          <div className="grid grid-cols-2 gap-1">
            {(
              [
                ["upload", "Upload a flyer", "upload"],
                ["url", "Use an image link", "link"],
              ] as const
            ).map(([m, label, icon]) => (
              <button
                key={m}
                type="button"
                onClick={() => setImageMode(m)}
                className={`flex items-center justify-center gap-2 px-4 py-3 text-xs font-extrabold uppercase tracking-wide ${imageMode === m ? "bg-ink text-on-ink" : "bg-surface text-muted hover:bg-red-soft"}`}
              >
                <Icon name={icon} size={15} /> {label}
              </button>
            ))}
          </div>

          <input ref={fileRef} id="image" name="image" type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => pickFile(e.target.files?.[0])} />
          {imageMode === "upload" ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); pickFile(e.dataTransfer.files?.[0]); }}
              className={`flex min-h-56 flex-col items-center justify-center gap-3 border-2 border-dashed p-6 text-center transition-colors ${dragging ? "border-accent bg-surface-2" : "border-line bg-surface"}`}
            >
              {filePreview ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={filePreview} alt="Your flyer" className="max-h-64 object-contain" />
                  <p className="text-xs font-semibold text-muted">{fileName}</p>
                  <div className="flex gap-2">
                    <label htmlFor="image" className="btn btn-soft cursor-pointer !py-2">Replace</label>
                    <button type="button" onClick={clearFile} className="btn btn-soft !py-2"><Icon name="x" size={14} /> Remove</button>
                  </div>
                </>
              ) : (
                <>
                  <Icon name="upload" size={36} className="text-muted" />
                  <p className="text-sm font-bold">Drag your flyer or image here</p>
                  <p className="text-xs text-muted">PNG, JPG or WebP, up to 2 MB</p>
                  <label htmlFor="image" className="btn btn-blue cursor-pointer !py-2">Choose a file</label>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label htmlFor="imageUrl" className="mb-1.5 flex items-center gap-2 text-sm font-bold"><Icon name="link" size={15} /> Link to an image</label>
                <input id="imageUrl" name="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/my-flyer.jpg" className="field" />
              </div>
              <div className="flex min-h-40 items-center justify-center bg-surface">
                {previewImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewImage} alt="Link preview" className="max-h-64 object-contain" />
                ) : (
                  <p className="text-xs font-semibold text-muted">The preview appears once you paste a link.</p>
                )}
              </div>
            </div>
          )}
          {imageMode === "url" && <input type="hidden" name="_mode" value="url" />}

          <label className={`flex items-center gap-3 bg-surface px-4 py-3 text-sm font-semibold ${imageMode === "url" ? "opacity-50" : ""}`}>
            <input type="checkbox" name="adoptable" checked={adoptable && imageMode === "upload"} disabled={imageMode === "url"} onChange={(e) => setAdoptable(e.target.checked)} className="h-4 w-4 accent-red" />
            <span>
              Adoptable: let people download the image
              <span className="block text-xs font-medium text-muted">{imageMode === "url" ? "Only available for uploaded files." : "Handy if you want others to share your flyer."}</span>
            </span>
          </label>
          <p className="text-xs text-muted">No image? Skip this step. Your ad shows a category icon instead.</p>
        </section>

        {/* 3 · Reach */}
        <section className={shown(2)}>
          <div>
            <label htmlFor="keywordDraft" className="mb-1.5 flex items-center gap-2 text-sm font-bold"><Icon name="tag" size={15} /> Keywords</label>
            <p className="mb-2 text-xs text-muted">They work like SEO: the better they match a search, the higher your ad ranks. Press Enter or comma to add, up to 10.</p>
            <input type="hidden" name="keywords" value={keywords.join(",")} />
            <div className="flex flex-wrap gap-2 bg-surface p-2">
              {keywords.map((k) => (
                <span key={k} className="flex items-center gap-1.5 bg-ink px-3 py-1.5 text-xs font-bold text-on-ink">
                  {k}
                  <button type="button" onClick={() => setKeywords((c) => c.filter((x) => x !== k))} aria-label={`Remove ${k}`}><Icon name="x" size={12} /></button>
                </span>
              ))}
              <input
                id="keywordDraft"
                value={keywordDraft}
                maxLength={30}
                disabled={keywords.length >= 10}
                onChange={(e) => (e.target.value.endsWith(",") ? addKeyword(e.target.value) : setKeywordDraft(e.target.value))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addKeyword(keywordDraft); }
                  if (e.key === "Backspace" && !keywordDraft) setKeywords((c) => c.slice(0, -1));
                }}
                onBlur={() => addKeyword(keywordDraft)}
                placeholder={keywords.length ? "Add another…" : "react, remote, design…"}
                className="min-w-40 flex-1 bg-transparent px-2 py-1.5 text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-bold">How should people apply?</span>
            <input type="hidden" name="applyMethod" value={method} />
            <div className="grid gap-2 sm:grid-cols-2">
              {METHODS.map((m) => (
                <button
                  type="button"
                  key={m.value}
                  onClick={() => setMethod(m.value)}
                  aria-pressed={method === m.value}
                  className={`flex items-start gap-3 p-4 text-left transition-colors duration-150 ${method === m.value ? "bg-ink text-on-ink" : "bg-surface hover:bg-red-soft"}`}
                >
                  <Icon name={m.icon} size={20} className="mt-0.5" />
                  <span>
                    <span className="block text-sm font-extrabold">{m.label}</span>
                    <span className={`block text-xs ${method === m.value ? "opacity-80" : "text-muted"}`}>{m.hint}</span>
                  </span>
                </button>
              ))}
            </div>
            {method !== "inbox" && (
              <div className="mt-3">
                <label htmlFor="applyValue" className="mb-1.5 block text-sm font-bold">
                  {method === "email" ? "Application email" : method === "phone" ? "Phone or WhatsApp number" : "Application link"}
                </label>
                <input id="applyValue" name="applyValue" value={methodValue} onChange={(e) => setMethodValue(e.target.value)} placeholder={METHODS.find((m) => m.value === method)?.placeholder} className="field" />
                <p className="mt-1 text-xs text-muted">Only signed-in applicants see this, so it stays out of reach of bots.</p>
              </div>
            )}
          </div>
        </section>

        {/* 4 · Details, co-hosts, runtime */}
        <section className={shown(3)}>
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wide">Details <span className="font-medium normal-case text-muted">· add only what this ad needs</span></h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {DETAIL_PRESETS.map((p) => (
                <button type="button" key={p} onClick={() => toggle(p)} className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold transition-colors duration-150 ${enabled.includes(p) ? "bg-ink text-on-ink" : "bg-surface text-muted hover:bg-red-soft"}`}>
                  <Icon name={enabled.includes(p) ? "check" : "plus"} size={13} /> {p}
                </button>
              ))}
              <button type="button" onClick={() => setCustom((c) => [...c, { label: "", value: "" }])} className="flex items-center gap-1.5 bg-green-soft px-3.5 py-2 text-sm font-semibold text-green">
                <Icon name="plus" size={13} /> Custom detail
              </button>
            </div>
          </div>
          {enabled.map((p) => (
            <div key={p} className="grid gap-2 sm:grid-cols-[10rem_1fr] sm:items-center">
              <input type="hidden" name="detailLabel" value={p} />
              <span className="text-sm font-bold">{p}</span>
              <input name="detailValue" value={detailValues[p] ?? ""} onChange={(e) => setDetailValues((v) => ({ ...v, [p]: e.target.value }))} maxLength={300} className="field" />
            </div>
          ))}
          {custom.map((c, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[10rem_1fr_auto]">
              <input name="detailLabel" value={c.label} maxLength={40} placeholder="Label" onChange={(e) => setCustom((arr) => arr.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} className="field" />
              <input name="detailValue" value={c.value} maxLength={300} placeholder="Value" onChange={(e) => setCustom((arr) => arr.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} className="field" />
              <button type="button" onClick={() => setCustom((arr) => arr.filter((_, j) => j !== i))} className="btn btn-soft" aria-label="Remove detail"><Icon name="x" size={14} /></button>
            </div>
          ))}

          <div>
            <label htmlFor="cohosts" className="mb-1.5 flex items-center gap-2 text-sm font-bold"><Icon name="users" size={15} /> Co-host emails <span className="font-medium text-muted">(optional)</span></label>
            <input id="cohosts" name="cohosts" value={cohostText} onChange={(e) => setCohostText(e.target.value)} placeholder="partner@company.com, other@company.com" className="field" />
            <p className="mt-1 text-xs text-muted">Up to {PRICING.maxCohosts} other clients can host with you. You pay for the ad.</p>
          </div>

          <div>
            <span className="mb-1.5 flex items-center gap-2 text-sm font-bold"><Icon name="clock" size={15} /> Stays up for</span>
            <input type="hidden" name="hours" value={hours} />
            <div className="grid grid-cols-4 gap-2">
              {AD_HOURS.map((h) => (
                <button type="button" key={h} onClick={() => setHours(h)} className={`px-2 py-3 text-sm font-extrabold transition-colors duration-150 ${hours === h ? "bg-ink text-on-ink" : "bg-surface text-muted hover:bg-red-soft"}`}>
                  {h} hrs
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 5 · Review */}
        <section className={shown(4)}>
          <dl className="divide-y divide-line bg-surface text-sm">
            <ReviewRow label="Title" value={title || "—"} onEdit={() => go(0)} />
            <ReviewRow label="Category" value={category || "—"} onEdit={() => go(0)} />
            <ReviewRow label="Image" value={previewImage ? (imageMode === "upload" ? fileName : "Linked image") : "None"} onEdit={() => go(1)} />
            <ReviewRow label="Keywords" value={keywords.join(", ") || "None"} onEdit={() => go(2)} />
            <ReviewRow
              label="Apply via"
              value={method === "inbox" ? "In the app" : `${METHODS.find((m) => m.value === method)?.label}: ${methodValue || "—"}`}
              onEdit={() => go(2)}
            />
            <ReviewRow label="Details" value={`${detailsFilled.length + custom.filter((c) => c.label && c.value).length} added`} onEdit={() => go(3)} />
            <ReviewRow label="Runtime" value={`${hours} hours`} onEdit={() => go(3)} />
          </dl>

          <div className="card space-y-2">
            <h3 className="text-lg font-extrabold">Price</h3>
            {quote.ok ? (
              <dl className="space-y-1 text-sm">
                <Row label={freeAdAvailable ? "Your first ad" : "Ad for this cause"} value={quote.base === 0 ? "Free" : naira(quote.base)} />
                {quote.cohostFee > 0 && <Row label={`Co-hosts (${cohostCount})`} value={naira(quote.cohostFee)} />}
                {quote.extensionFee > 0 && <Row label={`Extended to ${hours} hrs`} value={naira(quote.extensionFee)} />}
                <div className="flex justify-between pt-2 text-base font-extrabold">
                  <dt>Total</dt>
                  <dd className={quote.total === 0 ? "text-green" : ""}>{quote.total === 0 ? "Free" : naira(quote.total)}</dd>
                </div>
              </dl>
            ) : (
              <ErrorMessage message={quote.error} />
            )}
          </div>

          <div className="space-y-2 bg-surface p-5 text-sm">
            <p className="font-extrabold">What happens next</p>
            <ol className="space-y-1.5 text-muted">
              <li className="flex gap-2"><Icon name="check" size={15} className="mt-0.5 text-green" /> {quote.ok && quote.total > 0 ? "You pay securely, then the ad goes live right away." : "Your ad goes live right away."}</li>
              <li className="flex gap-2"><Icon name="eye" size={15} className="mt-0.5" /> Every signed-in user sees it at least once, and followers of {category || "your category"} get notified.</li>
              <li className="flex gap-2"><Icon name="mail" size={15} className="mt-0.5" /> Replies and applications reach your inbox and dashboard stats.</li>
              <li className="flex gap-2"><Icon name="clock" size={15} className="mt-0.5" /> After {hours} hours it ends. You then have 5 days to restore it for 40% of its price.</li>
            </ol>
          </div>
        </section>

        <ErrorMessage message={stepError || state.error} />

        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={() => go(step - 1)} disabled={step === 0} className="btn btn-soft">
            <Icon name="back" size={15} /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={() => go(step + 1)} className="btn btn-blue">
              Next: {STEPS[step + 1].title} <Icon name="arrow" size={15} />
            </button>
          ) : (
            <SubmitButton pendingText="Creating…">
              {quote.ok && quote.total > 0 ? `Continue to payment (${naira(quote.total)})` : "Put the ad up"}
            </SubmitButton>
          )}
        </div>
      </div>

      {/* Live preview of the ad as people will see it */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-muted"><Icon name="eye" size={14} /> Live preview</p>
        <div className="bg-surface">
          <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
            {previewImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewImage} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted">
                <Icon name={CATEGORY_ICONS[category] ?? "grid"} size={48} />
              </div>
            )}
            {category && (
              <span className="absolute left-0 top-0 flex items-center gap-1.5 bg-ink px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-on-ink">
                <Icon name={CATEGORY_ICONS[category] ?? "grid"} size={13} /> {category}
              </span>
            )}
            <span className="absolute bottom-0 right-0 flex items-center gap-1.5 bg-paper px-3 py-1.5 text-xs font-bold">
              <Icon name="clock" size={13} /> {hours}h left
            </span>
          </div>
          <div className="space-y-3 p-5">
            <h3 className="text-lg font-extrabold leading-snug">{title || "Your ad title"}</h3>
            <p className="line-clamp-3 text-sm text-muted">{description || "Your description shows here as you type."}</p>
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {keywords.slice(0, 4).map((k) => (
                  <span key={k} className="bg-paper px-2.5 py-1 text-xs font-semibold text-muted">{k}</span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-1.5 pt-1 text-xs font-bold text-ink">
              <Icon name={METHODS.find((m) => m.value === method)?.icon ?? "send"} size={13} />
              Apply via {METHODS.find((m) => m.value === method)?.label.toLowerCase()}
            </div>
          </div>
        </div>
      </aside>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className="font-bold">{value}</dd>
    </div>
  );
}

function ReviewRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <dt className="w-24 shrink-0 text-xs font-extrabold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="min-w-0 flex-1 truncate font-semibold">{value}</dd>
      <button type="button" onClick={onEdit} className="text-xs font-bold text-accent">Edit</button>
    </div>
  );
}
