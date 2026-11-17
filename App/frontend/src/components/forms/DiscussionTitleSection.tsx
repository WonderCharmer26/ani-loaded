import { DiscussionFormApi } from "@/types/discussionForm";
import { getFieldErrorMessage } from "./getFieldErrorMessage";

type DiscussionTitleSectionProps = {
  form: DiscussionFormApi;
};

// Component for the Title part of the form (reuse for the list page)
export default function DiscussionTitleSection({
  form,
}: DiscussionTitleSectionProps) {
  return (
    <form.Field
      name="title"
      children={(field) => {
        const errorMessage = getFieldErrorMessage(field.state.meta.errors?.[0]);

        return (
          <div className="flex flex-col gap-1">
            {/* textarea so long titles wrap, enter is blocked to keep it one "line" */}
            <textarea
              id={field.name}
              name={field.name}
              aria-label="Title"
              rows={1}
              value={field.state.value ?? ""}
              onBlur={field.handleBlur}
              onChange={(event) =>
                field.handleChange(event.target.value.replace(/\n/g, " "))
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") event.preventDefault();
              }}
              placeholder="Give your discussion a title"
              className="field-sizing-content w-full resize-none bg-transparent font-geist text-[22px]/8 font-bold tracking-[-0.02em] text-[#F3F5F9] placeholder:text-[#4A5262] focus:outline-none sm:text-[28px]/9"
            />
            {errorMessage ? (
              <span className="block font-geist text-sm text-red-400">{errorMessage}</span>
            ) : null}
          </div>
        );
      }}
    />
  );
}
