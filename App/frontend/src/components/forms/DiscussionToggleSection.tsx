import { DiscussionFormApi } from "@/types/discussionForm";

type DiscussionToggleSectionProps = {
  form: DiscussionFormApi;
};

type ToggleProps = {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

// small inline switch used in the composer footer
function Toggle({ label, description, checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      title={description}
      onClick={() => onChange(!checked)}
      className="group flex items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#4DA3F0]"
    >
      <span
        className={`flex h-4.5 w-8 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ${
          checked ? "bg-[#4DA3F0]" : "bg-[#2A3342] group-hover:bg-[#344055]"
        }`}
      >
        <span
          className={`size-3.5 rounded-full transition-all duration-200 ${
            checked ? "translate-x-3.5 bg-white" : "translate-x-0 bg-[#8793A8]"
          }`}
        />
      </span>
      <span
        className={`font-geist text-[13px]/4.5 font-medium transition-colors ${
          checked ? "text-[#D7DDE8]" : "text-[#97A3B8]"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

export default function DiscussionToggleSection({
  form,
}: DiscussionToggleSectionProps) {
  return (
    <div className="flex items-center gap-5">
      <form.Field
        name="is_spoiler"
        children={(field) => (
          <Toggle
            label="Spoiler"
            description="Mark this discussion as spoiler content."
            checked={field.state.value}
            onChange={(checked) => field.handleChange(checked)}
          />
        )}
      />
      <form.Field
        name="is_locked"
        children={(field) => (
          <Toggle
            label="Lock replies"
            description="Prevent new replies from being added."
            checked={field.state.value}
            onChange={(checked) => field.handleChange(checked)}
          />
        )}
      />
    </div>
  );
}
